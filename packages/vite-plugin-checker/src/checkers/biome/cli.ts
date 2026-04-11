import { exec } from 'node:child_process'
import { stripVTControlCharacters as strip } from 'node:util'
import { createFrame } from '../../codeFrame.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { normalizePath, readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import type {
  BiomeOutput,
  Diagnostic,
  LegacyDiagnostic,
  ModernDiagnostic,
} from './types.js'

export const severityMap = {
  error: DiagnosticLevel.Error,
  warning: DiagnosticLevel.Warning,
  info: DiagnosticLevel.Suggestion,
  information: DiagnosticLevel.Suggestion,
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
  /** Embedded source code from legacy Biome output (pre-2.4). */
  sourceCode?: string
}

function isModernDiagnostic(d: Diagnostic): d is ModernDiagnostic {
  return d.location !== undefined && typeof d.location.path === 'string'
}

function isLegacyDiagnostic(d: Diagnostic): d is LegacyDiagnostic {
  return (
    d.location !== undefined &&
    typeof d.location.path === 'object' &&
    d.location.path !== null &&
    'file' in d.location.path
  )
}

function getEntries(parsed: BiomeOutput, cwd: string): Entry[] {
  return parsed.diagnostics.flatMap((d): Entry[] => {
    if (!d.location) return []

    if (isModernDiagnostic(d)) {
      return [
        {
          file: normalizePath(d.location.path, cwd),
          message: d.message,
          category: d.category ?? '',
          severity: d.severity,
          start: d.location.start,
          end: d.location.end,
        },
      ]
    }

    if (isLegacyDiagnostic(d)) {
      const file = d.location.path?.file ?? ''
      return [
        {
          file: normalizePath(file, cwd),
          message: d.description,
          category: d.category ?? '',
          severity: d.severity,
          start: getLineAndColumn(d.location.sourceCode, d.location.span?.[0]),
          end: getLineAndColumn(d.location.sourceCode, d.location.span?.[1]),
          sourceCode: d.location.sourceCode,
        },
      ]
    }

    return []
  })
}

function getUniqueFiles(entries: Entry[]) {
  return Array.from(new Set(entries.map((e) => e.file)))
}

function buildDiagnostics(
  entries: Entry[],
  sources: Map<string, string>,
): NormalizedDiagnostic[] {
  return entries.flatMap((entry) => {
    // Prefer embedded source code (legacy), fall back to disk read (modern).
    const source = entry.sourceCode ?? sources.get(entry.file)
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

function sanitizeBiomeOutput(output: string) {
  // Biome on Windows emits unescaped backslashes in JSON path values
  return output.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
}

/**
 * Convert a byte-offset into `text` to a 1-based line/column pair.
 * Used only for the legacy Biome schema (< 2.4) which reports positions
 * as byte offsets into the embedded `sourceCode`.
 */
function getLineAndColumn(text?: string, offset?: number) {
  if (!text || !offset) return { line: 0, column: 0 }

  let line = 1
  let column = 1

  for (let i = 0; i < offset; i++) {
    if (text[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }

  return { line, column }
}

async function parseBiomeOutput(
  output: string,
  cwd: string,
): Promise<NormalizedDiagnostic[]> {
  let parsed: BiomeOutput
  try {
    parsed = JSON.parse(sanitizeBiomeOutput(output))
  } catch {
    return []
  }

  const entries = getEntries(parsed, cwd)

  // Only read from disk for entries that don't have embedded source code.
  const filesNeedingRead = getUniqueFiles(entries.filter((e) => !e.sourceCode))
  const sourceCache = await readSources(filesNeedingRead)

  return buildDiagnostics(entries, sourceCache)
}
