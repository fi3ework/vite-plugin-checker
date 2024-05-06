import { exec } from 'child_process'
import { type NormalizedDiagnostic } from '../../logger.js'
import { DiagnosticLevel } from '../../types.js'
import type { BiomeOutput } from './types.js'

export const severityMap = {
  error: DiagnosticLevel.Error,
  warning: DiagnosticLevel.Warning,
  info: DiagnosticLevel.Suggestion,
} as const

export function getBiomeCommand(command: string, flags: string, files: string) {
  const defaultFlags = '--reporter json'
  return ['biome', command || 'lint', flags, defaultFlags, files].filter(Boolean).join(' ')
}

export function runBiome(command: string) {
  return new Promise<NormalizedDiagnostic[]>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve([...parseBiomeOutput(stdout)])
    })
  })
}

function parseBiomeOutput(output: string) {
  let parsed: BiomeOutput
  try {
    parsed = JSON.parse(output)
  } catch (e) {
    return []
  }

  const diagnostics: NormalizedDiagnostic[] = parsed.diagnostics.map((d) => {
    return {
      level: severityMap[d.severity as keyof typeof severityMap] ?? DiagnosticLevel.Error,
      message: `[${d.category}] ${d.description}`,
      conclusion: '',
      checker: 'Biome',
      id: d.location.path.file,
      codeFrame: d.source || '',
      loc: {
        file: d.location.path.file,
        start: getLineAndColumn(d.location.sourceCode, d.location.span?.[0]),
        end: getLineAndColumn(d.location.sourceCode, d.location.span?.[1]),
      },
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
