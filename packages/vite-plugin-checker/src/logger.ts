import chalk from 'chalk'
import { readFile } from 'fs/promises'
import os from 'os'
import strip from 'strip-ansi'
import { ErrorPayload } from 'vite'

import { codeFrameColumns, SourceLocation } from '@babel/code-frame'

import { lspRange2Location, uriToAbsPath } from './utils'

import type {
  Diagnostic as LspDiagnostic,
  URI,
  PublishDiagnosticsParams,
} from 'vscode-languageclient/node'

// TODO: remove ./codeFrame.ts and ./utils.ts

import type {
  Diagnostic as TsDiagnostic,
  flattenDiagnosticMessageText as flattenDiagnosticMessageTextType,
  LineAndCharacter,
} from 'typescript'

interface NormalizedDiagnostic {
  /** error message */
  message?: string
  /** error conclusion */
  conclusion?: string
  /** error stack */
  stack?: string | string[]
  /** file name */
  id?: string
  /** checker diagnostic source */
  checker: string
  /** raw code frame generated by @babel/code-frame */
  codeFrame?: string
  /** code frame, but striped */
  stripedCodeFrame?: string
  /** error code location */
  loc?: SourceLocation
  /** error level */
  level?: DiagnosticCategory
}

// copied from TypeScript because we used `import type`.
export enum DiagnosticCategory {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3,
}

export function diagnosticToTerminalLog(d: NormalizedDiagnostic): string {
  const labelMap: Record<DiagnosticCategory, string> = {
    [DiagnosticCategory.Error]: chalk.bold.red('ERROR'),
    [DiagnosticCategory.Warning]: chalk.bold.yellow('WARNING'),
    [DiagnosticCategory.Suggestion]: chalk.bold.blue('SUGGESTION'),
    [DiagnosticCategory.Message]: chalk.bold.cyan('MESSAGE'),
  }

  const levelLabel = labelMap[d.level || DiagnosticCategory.Error]
  const fileLabel = chalk.green.bold('FILE') + ' '
  const position = d.loc
    ? chalk.yellow(d.loc.start.line) + ':' + chalk.yellow(d.loc.start.column)
    : ''

  return [
    levelLabel + ' ' + d.message,
    fileLabel + d.id + ':' + position + os.EOL,
    d.codeFrame + os.EOL,
    d.conclusion,
  ]
    .filter(Boolean)
    .join(os.EOL)
}

export function diagnosticToViteError(d: NormalizedDiagnostic): ErrorPayload['err'] {
  let loc: ErrorPayload['err']['loc']
  if (d.loc) {
    loc = {
      file: d.id,
      line: d.loc.start.line,
      column: typeof d.loc.start.column === 'number' ? d.loc.start.column : 0,
    }
  }

  return {
    message: d.message + os.EOL + d.stripedCodeFrame,
    stack:
      typeof d.stack === 'string' ? d.stack : Array.isArray(d.stack) ? d.stack.join(os.EOL) : '',
    id: d.id,
    frame: d.codeFrame,
    plugin: `vite-plugin-checker(${d.checker})`,
    loc,
  }
}

export function createFrame({
  source,
  location,
}: {
  /** file source code */
  source: string
  location: SourceLocation
}) {
  const frame = codeFrameColumns(source, location, {
    // worker tty did not fork parent process stdout, let's make a workaround
    forceColor: true,
  })
    .split('\n')
    .map((line) => '  ' + line)
    .join(os.EOL)

  return frame
}

export function tsLocationToBabelLocation(
  tsLoc: Record<'start' | 'end', LineAndCharacter /** 0-based */>
): SourceLocation {
  return {
    start: { line: tsLoc.start.line + 1, column: tsLoc.start.character + 1 },
    end: { line: tsLoc.end.line + 1, column: tsLoc.end.character + 1 },
  }
}

/* ------------------------------- TypeScript ------------------------------- */

export function normalizeTsDiagnostic(d: TsDiagnostic): NormalizedDiagnostic {
  const fileName = d.file?.fileName
  const {
    flattenDiagnosticMessageText,
  }: {
    flattenDiagnosticMessageText: typeof flattenDiagnosticMessageTextType
  } = require('typescript')

  const message = flattenDiagnosticMessageText(d.messageText, os.EOL)

  let loc: SourceLocation | undefined
  const pos = d.start === undefined ? null : d.file?.getLineAndCharacterOfPosition(d.start)
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
    level: d.category,
  }
}

/* ----------------------------------- VLS ---------------------------------- */

export function normalizeLspDiagnostic({
  diagnostic,
  absFilePath,
  fileText,
}: {
  diagnostic: LspDiagnostic
  absFilePath: string
  fileText: string
}): NormalizedDiagnostic {
  let level = DiagnosticCategory.Error
  const loc = lspRange2Location(diagnostic.range)
  const codeFrame = codeFrameColumns(fileText, loc)

  switch (diagnostic.severity) {
    case 1: // Error
      level = DiagnosticCategory.Error
      break
    case 2: // Warning
      level = DiagnosticCategory.Warning
      break
    case 3: // Information
      level = DiagnosticCategory.Message
      break
    case 4: // Hint
      level = DiagnosticCategory.Suggestion
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

export async function normalizePublishDiagnosticParams(
  publishDiagnostics: PublishDiagnosticsParams
): Promise<NormalizedDiagnostic[]> {
  const diagnostics = publishDiagnostics.diagnostics
  const absFilePath = uriToAbsPath(publishDiagnostics.uri)
  const fileText = await readFile(absFilePath, 'utf-8')

  const res = diagnostics.map((d) => {
    return normalizeLspDiagnostic({
      diagnostic: d,
      absFilePath,
      fileText,
    })
  })

  return res

  // const thing = normalizeLspDiagnostic(publishDiagnostics)
  // const location = lspRange2Location(d.range)
  // const path = publishDiagnostics
  // logChunk += `${os.EOL}${chalk.green.bold('FILE ')} ${absFilePath}:${location.start.line}:${
  //   location.start.column
  // }${os.EOL}`

  // if (diagnostic.severity === vscodeLanguageserverNode.DiagnosticSeverity.Error) {
  //   logChunk += `${chalk.red.bold('ERROR ')} ${diagnostic.message.trim()}`
  // } else {
  //   logChunk += `${chalk.yellow.bold('WARN ')} ${diagnostic.message.trim()}`
  // }

  // logChunk += os.EOL + os.EOL
  // logChunk += codeFrameColumns(fileText, location)
  // return logChunk

  // return {
  //   message,
  //   conclusion: '',
  //   codeFrame,
  //   stripedCodeFrame: codeFrame && strip(codeFrame),
  //   id: fileName,
  //   checker: 'TypeScript',
  //   loc,
  //   level: d.category,
  // }
  // return 1 as any
}

/* --------------------------------- vue-tsc -------------------------------- */

/* --------------------------------- ESLint --------------------------------- */
