import { stripVTControlCharacters as strip } from 'node:util'
import {
  createFrame,
  createSnippet,
  offsetRangeToBabelLocation,
} from '../../codeFrame.js'
import { colorize } from '../../colors.js'
import { consoleLog, type NormalizedDiagnostic } from '../../logger.js'
import { normalizePath, readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import { runCommand } from '../_shared/runCommand.js'
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
      colorize(
        'yellow',
        'vite-plugin-checker will force append "--format json" to the flags in dev mode, please don\'t use "--format" or "-f" flag in "config.oxlint.lintCommand".',
      ),
      'warn',
    )

    parsed.splice(index, 2, '--format', 'json')
  }

  return parsed
}

export async function runOxlint(
  argv: string[],
  cwd: string,
): Promise<NormalizedDiagnostic[]> {
  let stdout: string
  try {
    stdout = await runCommand(argv, cwd)
  } catch (error) {
    logSpawnError(error)
    return []
  }
  return parseOxlintOutput(stdout, cwd).catch(() => [])
}

function logSpawnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  consoleLog(
    colorize(
      'yellow',
      `vite-plugin-checker failed to spawn oxlint: ${message}`,
    ),
    'warn',
  )
}

type Span = { offset: number; length: number }
type Entry = {
  file: string
  span: Span
  code: string
  message: string
  severity: string
  url?: string
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
    ({ filename, labels, code, message, severity, url }) => {
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
          url,
        },
      ] as Entry[]
    },
  )
}

function getUniqueFiles(entries: Entry[]) {
  return [...new Set(entries.map((e) => e.file))]
}

/**
 * Convert a UTF-8 byte [offset, length] range (as emitted by oxlint) into
 * UTF-16 string code-unit indices for `source`.
 */
function utf8ByteRangeToCharRange(
  source: string,
  byteOffset: number,
  byteLength: number,
): { offset: number; length: number } {
  const startByte = Math.max(0, byteOffset)
  const endByte = startByte + Math.max(0, byteLength)

  let i = 0
  let bytes = 0

  const step = () => {
    const code = source.charCodeAt(i)
    if (code <= 0x7f) {
      bytes += 1
      i += 1
    } else if (code <= 0x7ff) {
      bytes += 2
      i += 1
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < source.length) {
      const next = source.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4
        i += 2
      } else {
        bytes += 3
        i += 1
      }
    } else {
      bytes += 3
      i += 1
    }
  }

  while (i < source.length && bytes < startByte) {
    step()
  }
  const charStart = i

  while (i < source.length && bytes < endByte) {
    step()
  }
  const charEnd = i

  return { offset: charStart, length: charEnd - charStart }
}

function buildDiagnostics(entries: Entry[], sources: Map<string, string>) {
  return entries.flatMap((entry) => {
    const source = sources.get(entry.file)
    if (!source) return []

    const { offset, length } = utf8ByteRangeToCharRange(
      source,
      entry.span.offset,
      entry.span.length,
    )
    const loc = offsetRangeToBabelLocation(source, offset, length)
    let codeFrame = ''
    try {
      codeFrame = createFrame(source, loc)
    } catch {
      // Fall back to empty frame so one failing diagnostic cannot discard the run
    }

    return [
      {
        message: `${entry.code}: ${entry.message}`,
        rule: entry.code,
        ruleUrl: entry.url,
        conclusion: '',
        level: mapSeverity(entry.severity),
        checker: 'oxlint',
        id: entry.file,
        codeFrame,
        stripedCodeFrame: codeFrame && strip(codeFrame),
        snippet: createSnippet(source, loc, entry.file),
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
