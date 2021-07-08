import { readFileSync } from 'fs'
import os from 'os'
import strip from 'strip-ansi'
import ts from 'typescript'
import { ErrorPayload } from 'vite'

import { codeFrameColumns, SourceLocation } from '@babel/code-frame'

import { createFrame, tsLocationToBabelLocation } from './codeFrame'

import type { Range } from 'vscode-languageclient'
import type { PublishDiagnosticsParams } from 'vscode-languageclient/node'

/**
 * TypeScript utils
 */

export const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

export function tsDiagnosticToViteError(d: ts.Diagnostic): ErrorPayload['err'] {
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
            location: tsLocationToBabelLocation({
              start: d.file?.getLineAndCharacterOfPosition(d.start),
              end: d.file?.getLineAndCharacterOfPosition(d.start + d.length),
            }),
          })
      ),
      stack: '',
      id: d.file?.fileName,
      plugin: 'vite-plugin-checker',
      loc,
    }
  }

  // ops, no detailed message
  return {
    message: ts.flattenDiagnosticMessageText(d.messageText, formatHost.getNewLine()),
    stack: '',
    id: d.file?.fileName,
    plugin: 'vite-plugin-checker',
    loc,
  }
}

/**
 * LSP utils
 */

export function uriToAbsPath(uri: string): string {
  return uri.slice('file://'.length)
}

export function range2Location(range: Range): SourceLocation {
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

export function lspDiagnosticToViteError(
  diagnostics: PublishDiagnosticsParams
): (ErrorPayload['err'] & { fileText: string }) | null {
  if (!diagnostics.diagnostics.length) return null

  const d = diagnostics.diagnostics[0]
  const absPath = uriToAbsPath(diagnostics.uri)
  const range = d.range
  let loc: ErrorPayload['err']['loc']
  if (range) {
    loc = {
      file: absPath,
      line: range.start.line + 1,
      column: range.start.character + 1,
    }
  }

  const fileText = readFileSync(absPath, 'utf-8')
  const location = range2Location(d.range)
  const columns = codeFrameColumns(fileText, location)

  // has detail message
  if (d.message && typeof d.range === 'object') {
    return {
      fileText,
      message: strip(
        ts.flattenDiagnosticMessageText(d.message, formatHost.getNewLine()) +
          os.EOL +
          os.EOL +
          columns
      ),
      stack: '',
      id: absPath,
      plugin: 'vite-plugin-checker',
      loc,
    }
  }

  // no detail message
  return {
    fileText,
    message: ts.flattenDiagnosticMessageText(d.message, formatHost.getNewLine()),
    stack: '',
    id: absPath,
    plugin: 'vite-plugin-checker',
    loc,
  }
}

/**
 * Others
 */

export function ensureCall(callback: CallableFunction) {
  setTimeout(() => {
    callback()
  })
}
