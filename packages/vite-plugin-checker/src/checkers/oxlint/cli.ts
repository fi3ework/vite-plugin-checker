import { execFile } from 'node:child_process'
import { stripVTControlCharacters as strip } from 'node:util'
import colors from 'picocolors'
import { createFrame, offsetRangeToBabelLocation } from '../../codeFrame.js'
import { consoleLog, type NormalizedDiagnostic } from '../../logger.js'
import { normalizePath, readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import { parseArgsStringToArgv } from '../stylelint/argv.js'

const severityMap = {
  error: DiagnosticLevel.Error,
  warning: DiagnosticLevel.Warning,
  info: DiagnosticLevel.Suggestion,
} as const

export function mapSeverity(s: string): DiagnosticLevel {
  return severityMap[s as keyof typeof severityMap] ?? DiagnosticLevel.Error
}

export function getOxlintCommand(command: string) {
  const parsed = parseArgsStringToArgv(command)

  const index = parsed.findIndex((p) => p === '--format' || p === '-f')
  if (index === -1) {
    parsed.push('--format', 'json')
  } else {
    consoleLog(
      colors.yellow(
        'vite-plugin-checker will force append "--format json" to the flags in dev mode, please don\'t use "--format" or "-f" flag in "config.oxlint.lintCommand".',
      ),
      'warn',
    )

    parsed.splice(index, 2, '--format', 'json')
  }

  return parsed
}

export function runOxlint(argv: string[], cwd: string) {
  return new Promise<NormalizedDiagnostic[]>((resolve, _reject) => {
    execFile(
      argv[0]!,
      argv.slice(1),
      {
        cwd,
        maxBuffer: Number.POSITIVE_INFINITY,
      },
      (_error, stdout, _stderr) => {
        parseOxlintOutput(stdout, cwd)
          .then(resolve)
          .catch(() => resolve([]))
      },
    )
  })
}

type Span = { offset: number; length: number }
type Entry = {
  file: string
  span: Span
  code: string
  message: string
  severity: string
}

async function parseOxlintOutput(
  output: string,
  cwd: string,
): Promise<NormalizedDiagnostic[]> {
  const parsed = safeParseOxlint(output)
  if (!parsed) return []

  const entries = getEntries(parsed, cwd)
  if (entries.length === 0) return []

  const files = getUniqueFiles(entries)
  const sourceCache = await readSources(files)

  return buildDiagnostics(entries, sourceCache)
}

function safeParseOxlint(output: string): OxlintOutput | null {
  try {
    return JSON.parse(output)
  } catch {
    return null
  }
}

function getEntries(parsed: OxlintOutput, cwd: string) {
  return parsed.diagnostics.flatMap(
    ({ filename, labels, code, message, severity }) => {
      const file = normalizePath(filename, cwd)

      const [label] = labels
      if (!label) return []

      return [
        {
          file,
          span: label.span,
          code,
          message,
          severity,
        },
      ] as Entry[]
    },
  )
}

function getUniqueFiles(entries: Entry[]) {
  return [...new Set(entries.map((e) => e.file))]
}

function buildDiagnostics(entries: Entry[], sources: Map<string, string>) {
  return entries.flatMap((entry) => {
    const source = sources.get(entry.file)
    if (!source) return []

    const loc = offsetRangeToBabelLocation(
      source,
      entry.span.offset,
      entry.span.length,
    )
    const codeFrame = createFrame(source, loc)

    return [
      {
        message: `${entry.code}: ${entry.message}`,
        conclusion: '',
        level: mapSeverity(entry.severity),
        checker: 'oxlint',
        id: entry.file,
        codeFrame,
        stripedCodeFrame: codeFrame && strip(codeFrame),
        loc,
      },
    ] as NormalizedDiagnostic[]
  })
}

type OxlintOutput = {
  diagnostics: Diagnostic[]
  number_of_files: number
  number_of_rules: number
  threads_count: number
  start_time: number
}

type Diagnostic = {
  message: string
  code: string
  severity: string
  causes: unknown[]
  url: string
  help: string
  filename: string
  labels: Label[]
  related: unknown[]
}

type Label = {
  label: string
  span: Record<'offset' | 'length' | 'line' | 'column', number>
}
