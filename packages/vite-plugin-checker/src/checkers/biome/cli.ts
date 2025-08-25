import { exec } from 'node:child_process'
import path from 'node:path'
import strip from 'strip-ansi'
import { createFrame } from '../../codeFrame.js'
import type { NormalizedDiagnostic } from '../../logger.js'
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
        resolve([...parseBiomeOutput(stdout, cwd)])
      },
    )
  })
}

function parseBiomeOutput(output: string, cwd: string) {
  let parsed: BiomeOutput
  try {
    parsed = JSON.parse(output)
  } catch {
    return []
  }

  const diagnostics: NormalizedDiagnostic[] = parsed.diagnostics.map((d) => {
    let file = d.location.path?.file
    if (file) {
      // Convert relative path to absolute path
      file = path.isAbsolute(file) ? file : path.resolve(cwd, file)
      file = path.normalize(file)
    }

    const loc = {
      file: file || '',
      start: getLineAndColumn(d.location.sourceCode, d.location.span?.[0]),
      end: getLineAndColumn(d.location.sourceCode, d.location.span?.[1]),
    }

    const codeFrame = createFrame(d.location.sourceCode || '', loc)

    return {
      message: `[${d.category}] ${d.description}`,
      conclusion: '',
      level:
        severityMap[d.severity as keyof typeof severityMap] ??
        DiagnosticLevel.Error,
      checker: 'Biome',
      id: file,
      codeFrame,
      stripedCodeFrame: codeFrame && strip(codeFrame),
      loc,
    }
  })

  return diagnostics
}

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
