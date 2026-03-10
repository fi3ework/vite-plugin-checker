import { exec } from 'node:child_process'
import { stripVTControlCharacters as strip } from 'util'
import { createFrame } from '../../codeFrame.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { normalizePath, readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import type { BiomeOutput } from './types.js'

export const severityMap = {
  error: DiagnosticLevel.Error,
  warning: DiagnosticLevel.Warning,
  info: DiagnosticLevel.Suggestion,
} as const

export function getBiomeCommand(command: string, flags: string, files: string) {
  const defaultFlags = '--reporter json'
  if (flags.includes('--flags')) {
    throw Error(
      `vite-plugin-checker will force append "--reporter json" to the flags in dev mode, please don't use "--flags" in "config.biome.flags".
If you need to customize "--flags" in build mode, please use "config.biome.build.flags" instead.`,
    )
  }
  return ['biome', command, flags, defaultFlags, files]
    .filter(Boolean)
    .join(' ')
}

export function runBiome(command: string, cwd: string) {
  return new Promise<NormalizedDiagnostic[]>((resolve, _reject) => {
    exec(
      command,
      {
        cwd,
        maxBuffer: Number.POSITIVE_INFINITY,
      },
      (_error, stdout, _stderr) => {
        parseBiomeOutput(stdout, cwd)
          .then(resolve)
          .catch(() => resolve([]))
      },
    )
  })
}

type Entry = {
  file: string
  message: string
  category: string
  severity: string
  start: { line: number; column: number }
  end: { line: number; column: number }
}

function getEntries(parsed: BiomeOutput, cwd: string): Entry[] {
  return parsed.diagnostics.map((d) => ({
    file: normalizePath(d.location.path, cwd),
    message: d.message,
    category: d.category ?? '',
    severity: d.severity,
    start: d.location.start ?? { line: 0, column: 0 },
    end: d.location.end ?? { line: 0, column: 0 },
  }))
}

function getUniqueFiles(entries: Entry[]) {
  return [...new Set(entries.map((e) => e.file))]
}

function buildDiagnostics(
  entries: Entry[],
  sources: Map<string, string>,
): NormalizedDiagnostic[] {
  return entries.flatMap((entry) => {
    const source = sources.get(entry.file)
    if (!source) return []

    const loc = {
      file: entry.file,
      start: entry.start,
      end: entry.end,
    }

    const codeFrame = createFrame(source, loc)

    return [
      {
        message: `[${entry.category}] ${entry.message}`,
        level:
          severityMap[entry.severity as keyof typeof severityMap] ??
          DiagnosticLevel.Error,
        checker: 'Biome',
        id: entry.file,
        codeFrame,
        stripedCodeFrame: codeFrame && strip(codeFrame),
        loc,
      },
    ]
  })
}

async function parseBiomeOutput(
  output: string,
  cwd: string,
): Promise<NormalizedDiagnostic[]> {
  let parsed: BiomeOutput
  try {
    parsed = JSON.parse(output)
  } catch {
    return []
  }

  const entries = getEntries(parsed, cwd)
  const files = getUniqueFiles(entries)
  const sourceCache = await readSources(files)

  return buildDiagnostics(entries, sourceCache)
}
