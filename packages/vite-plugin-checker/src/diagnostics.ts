import { createHash } from 'node:crypto'
import path from 'node:path'

import type { Diagnostic, DiagnosticSeverity } from './protocol.js'
import {
  DiagnosticLevel,
  type DiagnosticRecord,
  type EditorLocation,
} from './types.js'

export interface DiagnosticContext {
  root: string
  editorUrl?: ((location: EditorLocation) => string | undefined) | undefined
}

const severities: Record<DiagnosticLevel, DiagnosticSeverity> = {
  [DiagnosticLevel.Error]: 'error',
  [DiagnosticLevel.Warning]: 'warning',
  [DiagnosticLevel.Suggestion]: 'info',
  [DiagnosticLevel.Message]: 'info',
}

function stripCode(message: string, code: string | undefined): string {
  if (!code) return message
  let stripped = message
  for (const prefix of [`[${code}] `, `${code}: `]) {
    if (stripped.startsWith(prefix)) stripped = stripped.slice(prefix.length)
  }
  const suffix = ` (${code})`
  if (stripped.endsWith(suffix)) stripped = stripped.slice(0, -suffix.length)
  return stripped
}

export function toDiagnostics(
  checkerId: string,
  records: DiagnosticRecord[],
  { root, editorUrl }: DiagnosticContext,
): Diagnostic[] {
  const seen = new Set<string>()

  return records.flatMap((record) => {
    const code = record.code ?? record.rule
    const message = stripCode(record.message, code).replace(/\r\n?/g, '\n')
    const rawFile = (record.loc?.file || record.id)?.split('?')[0]
    const file =
      rawFile && path.isAbsolute(rawFile) ? path.normalize(rawFile) : undefined
    const line = record.loc?.line || undefined
    const column = line ? record.loc?.column || 1 : undefined
    const displayFile = file
      ? path.relative(root, file).split(path.sep).join('/')
      : undefined

    const hash = createHash('sha1')
      .update(
        JSON.stringify([checkerId, displayFile, line, column, code, message]),
      )
      .digest('hex')
      .slice(0, 16)
    if (seen.has(hash)) return []
    seen.add(hash)

    const diagnostic: Diagnostic = {
      id: hash,
      checkerId,
      level: severities[record.level ?? DiagnosticLevel.Error] ?? 'error',
      message,
    }
    if (code) diagnostic.code = code
    if (record.ruleUrl) diagnostic.docsUrl = record.ruleUrl
    if (file) {
      diagnostic.file = file
      diagnostic.displayFile = displayFile!
      const url = editorUrl?.({ file, line: line ?? 1, column: column ?? 1 })
      if (url) diagnostic.editorUrl = url
    }
    if (line) {
      diagnostic.line = line
      diagnostic.column = column
    }
    if (record.endLine) {
      diagnostic.endLine = record.endLine
      if (record.endColumn) diagnostic.endColumn = record.endColumn
    }
    if (record.snippet) diagnostic.snippet = record.snippet

    return [diagnostic]
  })
}
