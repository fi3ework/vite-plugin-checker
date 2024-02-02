import type {
  Diagnostic as LspDiagnostic,
  PublishDiagnosticsParams,
} from 'vscode-languageclient/node.js'
import * as _vscodeUri from 'vscode-uri'
import type { NormalizedDiagnostic, SourceLocation } from 'vite-plugin-checker/logger'
import { codeFrameColumns, strip } from 'vite-plugin-checker/logger'
import { DiagnosticLevel } from 'vite-plugin-checker/types'
import fs from 'node:fs'
import type { Range } from 'vscode-languageclient'

// hack to compatible with Jiti
// see details: https://github.com/fi3ework/vite-plugin-checker/issues/197
const URI = _vscodeUri?.default?.URI ?? _vscodeUri.URI

export async function normalizePublishDiagnosticParams(
  publishDiagnostics: PublishDiagnosticsParams
): Promise<NormalizedDiagnostic[]> {
  const diagnostics = publishDiagnostics.diagnostics
  const absFilePath = uriToAbsPath(publishDiagnostics.uri)
  const { readFile } = fs.promises
  const fileText = await readFile(absFilePath, 'utf-8')

  const res = diagnostics.map((d) => {
    return normalizeLspDiagnostic({
      diagnostic: d,
      absFilePath,
      fileText,
    })
  })

  return res
}

export function normalizeLspDiagnostic({
  diagnostic,
  absFilePath,
  fileText,
}: {
  diagnostic: LspDiagnostic
  absFilePath: string
  fileText: string
}): NormalizedDiagnostic {
  let level = DiagnosticLevel.Error
  const loc = lspRange2Location(diagnostic.range)
  const codeFrame = codeFrameColumns(fileText, loc)

  switch (diagnostic.severity) {
    case 1: // Error
      level = DiagnosticLevel.Error
      break
    case 2: // Warning
      level = DiagnosticLevel.Warning
      break
    case 3: // Information
      level = DiagnosticLevel.Message
      break
    case 4: // Hint
      level = DiagnosticLevel.Suggestion
      break
  }

  return {
    message: diagnostic.message.trim(),
    conclusion: '',
    codeFrame,
    stripedCodeFrame: codeFrame && strip(codeFrame),
    id: absFilePath,
    checker: 'VLS',
    loc,
    level,
  }
}

export function uriToAbsPath(documentUri: string): string {
  return URI.parse(documentUri).fsPath
}

export function lspRange2Location(range: Range): SourceLocation {
  return {
    start: {
      line: range.start.line + 1,
      column: range.start.character + 1,
    },
    end: {
      line: range.end.line + 1,
      column: range.end.character + 1,
    },
  }
}
