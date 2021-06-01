import os from 'os'
import strip from 'strip-ansi'
import ts from 'typescript'
import { ErrorPayload } from 'vite'

import { createFrame } from './codeFrame'

export const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

export function ensureCall(callback: CallableFunction) {
  setTimeout(() => {
    callback()
  })
}

export function toViteError(d: ts.Diagnostic): ErrorPayload['err'] {
  const pos = d.start === undefined ? null : d.file?.getLineAndCharacterOfPosition(d.start)
  let loc: ErrorPayload['err']['loc']
  if (pos) {
    loc = {
      file: d.file?.fileName,
      line: pos.line + 1,
      column: pos.character + 1,
    }
  }

  // has detail message
  if (d.file && typeof d.start === 'number' && typeof d.length === 'number') {
    return {
      message: strip(
        ts.flattenDiagnosticMessageText(d.messageText, formatHost.getNewLine()) +
          os.EOL +
          os.EOL +
          createFrame({
            source: d.file!.text,
            start: d.file?.getLineAndCharacterOfPosition(d.start),
            end: d.file?.getLineAndCharacterOfPosition(d.start + d.length),
          })
      ),
      stack: '',
      id: d.file?.fileName,
      plugin: 'vite-plugin-ts-checker',
      loc,
    }
  }

  // no detail message
  return {
    message: ts.flattenDiagnosticMessageText(d.messageText, formatHost.getNewLine()),
    stack: '',
    id: d.file?.fileName,
    plugin: 'vite-plugin-ts-checker',
    loc,
  }
}
