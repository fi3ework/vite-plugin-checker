import { execFile } from 'node:child_process'
import { stripVTControlCharacters as strip } from 'node:util'
import { createFrame } from '../../codeFrame.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { normalizePath, readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import { parseArgsStringToArgv } from '../stylelint/argv.js'
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

export function getBiomeCommand(
  command: string,
  flags: string,
  files: string[],
): string[] {
  if (flags.includes('--flags')) {
    throw Error(
      `vite-plugin-checker will force append "--reporter json" to the flags in dev mode, please don't use "--flags" in "config.biome.flags".
If you need to customize "--flags" in build mode, please use "config.biome.build.flags" instead.`,
    )
  }
  return [
    'biome',
    command,
    ...(flags ? parseArgsStringToArgv(flags) : []),
    '--reporter',
    'json',
    ...files,
  ]
}

export function runBiome(argv: string[], cwd: string) {
  return new Promise<NormalizedDiagnostic[]>((resolve, _reject) => {
    execFile(
      argv[0]!,
      argv.slice(1),
      {
        cwd,
        maxBuffer: Number.POSITIVE_INFINITY,
        // Required on Windows so execFile can resolve .cmd/.bat shims in
        // node_modules/.bin. Node >=18.20/20.12/22 auto-quotes argv under
        // shell:true, preserving the no-splitting guarantee.
        shell: process.platform === 'win32',
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
  diagnosticIndex: number
  isModern: boolean
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
  return parsed.diagnostics.flatMap((d, diagnosticIndex): Entry[] => {
    if (!d.location) return []

    if (isModernDiagnostic(d)) {
      return [
        {
          diagnosticIndex,
          isModern: true,
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
          diagnosticIndex,
          isModern: false,
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

function sanitizeBiomeOutputCandidate(
  output: string,
  unicodeEscapesAreRaw: boolean,
) {
  type Context =
    | 'root'
    | 'diagnostics'
    | 'diagnostic'
    | 'location'
    | 'path'
    | 'pathObject'
    | 'targetPath'
    | 'other'

  const replacements: { start: number; end: number; value: string }[] = []
  const skipWhitespace = (index: number) => {
    let cursor = index
    while (/\s/.test(output[cursor] ?? '')) cursor++
    return cursor
  }
  const scanString = (start: number) => {
    let index = start + 1
    while (index < output.length) {
      if (output[index] === '\\') {
        index += 2
      } else if (output[index] === '"') {
        return index + 1
      } else {
        index++
      }
    }
    return output.length
  }
  const readKey = (start: number, end: number) => {
    try {
      return JSON.parse(output.slice(start, end)) as string
    } catch {
      return ''
    }
  }
  const hasRawBackslash = (path: string) => {
    for (let index = 0; index < path.length; index++) {
      if (path[index] !== '\\') continue

      let runEnd = index
      while (path[runEnd] === '\\') runEnd++
      if ((runEnd - index) % 2 === 1) {
        const escaped = path[runEnd]
        const isUnicodeEscape =
          !unicodeEscapesAreRaw &&
          escaped === 'u' &&
          /^[0-9a-f]{4}$/i.test(path.slice(runEnd + 1, runEnd + 5))
        if (escaped !== '"' && escaped !== '/' && !isUnicodeEscape) {
          return true
        }
      }
      index = runEnd - 1
    }
    return false
  }

  const scanValue = (start: number, context: Context): number => {
    const index = skipWhitespace(start)
    const character = output[index]

    if (character === '"') {
      const end = scanString(index)
      if (context === 'path' || context === 'targetPath') {
        const path = output.slice(index + 1, end - 1)
        if (hasRawBackslash(path)) {
          replacements.push({
            start: index + 1,
            end: end - 1,
            value: path.replaceAll('\\', '\\\\'),
          })
        }
      }
      return end
    }

    if (character === '{') {
      const objectContext = context === 'path' ? 'pathObject' : context
      let cursor = index + 1
      while (cursor < output.length) {
        cursor = skipWhitespace(cursor)
        if (output[cursor] === '}') return cursor + 1
        if (output[cursor] !== '"') return output.length

        const keyStart = cursor
        const keyEnd = scanString(keyStart)
        const key = readKey(keyStart, keyEnd)
        cursor = skipWhitespace(keyEnd)
        if (output[cursor] !== ':') return output.length

        let childContext: Context = 'other'
        if (objectContext === 'root' && key === 'diagnostics') {
          childContext = 'diagnostics'
        } else if (objectContext === 'diagnostic' && key === 'location') {
          childContext = 'location'
        } else if (objectContext === 'location' && key === 'path') {
          childContext = 'path'
        } else if (objectContext === 'pathObject' && key === 'file') {
          childContext = 'targetPath'
        }

        cursor = skipWhitespace(scanValue(cursor + 1, childContext))
        if (output[cursor] === ',') {
          cursor++
        } else if (output[cursor] === '}') {
          return cursor + 1
        } else {
          return output.length
        }
      }
      return cursor
    }

    if (character === '[') {
      const childContext = context === 'diagnostics' ? 'diagnostic' : 'other'
      let cursor = index + 1
      while (cursor < output.length) {
        cursor = skipWhitespace(cursor)
        if (output[cursor] === ']') return cursor + 1
        cursor = skipWhitespace(scanValue(cursor, childContext))
        if (output[cursor] === ',') {
          cursor++
        } else if (output[cursor] === ']') {
          return cursor + 1
        } else {
          return output.length
        }
      }
      return cursor
    }

    let end = index
    while (end < output.length && !/[\s,}\]]/.test(output[end]!)) end++
    return end
  }

  scanValue(0, 'root')

  if (replacements.length === 0) return output

  const chunks: string[] = []
  let cursor = 0
  for (const replacement of replacements) {
    chunks.push(output.slice(cursor, replacement.start), replacement.value)
    cursor = replacement.end
  }
  chunks.push(output.slice(cursor))
  return chunks.join('')
}

export function sanitizeBiomeOutput(output: string) {
  return sanitizeBiomeOutputCandidate(output, false)
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

export async function parseBiomeOutput(
  output: string,
  cwd: string,
): Promise<NormalizedDiagnostic[]> {
  let parsed: BiomeOutput
  const sanitizedOutput = sanitizeBiomeOutput(output)
  try {
    parsed = JSON.parse(sanitizedOutput)
  } catch {
    return []
  }

  const entries = getEntries(parsed, cwd)
  const unicodeRawOutput = sanitizeBiomeOutputCandidate(output, true)
  let unicodeRawEntries: Entry[] = []
  if (unicodeRawOutput !== sanitizedOutput) {
    try {
      unicodeRawEntries = getEntries(JSON.parse(unicodeRawOutput), cwd)
    } catch {
      // The standard JSON interpretation remains authoritative.
    }
  }

  const unicodeRawByDiagnostic = new Map(
    unicodeRawEntries
      .filter((entry) => entry.isModern)
      .map((entry) => [entry.diagnosticIndex, entry]),
  )
  const entriesNeedingRead = entries.flatMap((entry): Entry[] => {
    if (!entry.isModern) return entry.sourceCode ? [] : [entry]

    const unicodeRaw = unicodeRawByDiagnostic.get(entry.diagnosticIndex)
    return unicodeRaw && unicodeRaw.file !== entry.file
      ? [entry, unicodeRaw]
      : [entry]
  })
  const filesNeedingRead = getUniqueFiles(entriesNeedingRead)
  const sourceCache = await readSources(filesNeedingRead)

  const resolvedEntries = entries.map((entry) => {
    if (!entry.isModern) return entry

    const unicodeRaw = unicodeRawByDiagnostic.get(entry.diagnosticIndex)
    if (
      unicodeRaw &&
      !sourceCache.has(entry.file) &&
      sourceCache.has(unicodeRaw.file)
    ) {
      return unicodeRaw
    }
    return entry
  })

  return buildDiagnostics(resolvedEntries, sourceCache)
}
