import { createRequire } from 'node:module'
import { createFrame, strip } from 'vite-plugin-checker/logger'
import type { DiagnosticLevel } from 'vite-plugin-checker/types'
import type { NormalizedDiagnostic, SourceLocation } from 'vite-plugin-checker/logger'
import type {
  Diagnostic as TsDiagnostic,
  flattenDiagnosticMessageText as flattenDiagnosticMessageTextType,
  LineAndCharacter,
} from 'typescript'
import os from 'node:os'

const _require = createRequire(import.meta.url)

export function tsLocationToBabelLocation(
  tsLoc: Record<'start' | 'end', LineAndCharacter /** 0-based */>
): SourceLocation {
  return {
    start: { line: tsLoc.start.line + 1, column: tsLoc.start.character + 1 },
    end: { line: tsLoc.end.line + 1, column: tsLoc.end.character + 1 },
  }
}

export function normalizeTsDiagnostic(d: TsDiagnostic): NormalizedDiagnostic {
  const fileName = d.file?.fileName
  const {
    flattenDiagnosticMessageText,
  }: {
    flattenDiagnosticMessageText: typeof flattenDiagnosticMessageTextType
  } = _require('typescript')

  const message = flattenDiagnosticMessageText(d.messageText, os.EOL)

  let loc: SourceLocation | undefined
  const pos = d.start === undefined ? null : d.file?.getLineAndCharacterOfPosition?.(d.start)
  if (pos && d.file && typeof d.start === 'number' && typeof d.length === 'number') {
    loc = tsLocationToBabelLocation({
      start: d.file?.getLineAndCharacterOfPosition(d.start),
      end: d.file?.getLineAndCharacterOfPosition(d.start + d.length),
    })
  }

  let codeFrame: string | undefined
  if (loc) {
    codeFrame = createFrame({
      source: d.file!.text,
      location: loc,
    })
  }

  return {
    message,
    conclusion: '',
    codeFrame,
    stripedCodeFrame: codeFrame && strip(codeFrame),
    id: fileName,
    checker: 'TypeScript',
    loc,
    level: d.category as any as DiagnosticLevel,
  }
}

export function normalizeVueTscDiagnostic(d: TsDiagnostic): NormalizedDiagnostic {
  const diagnostic = normalizeTsDiagnostic(d)
  diagnostic.checker = 'vue-tsc'
  return diagnostic
}
