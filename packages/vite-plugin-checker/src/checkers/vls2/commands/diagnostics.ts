import {
  vscodeLanguageserverNode,
  vscodeLanguageserverTextdocument,
  vls,
  chokidar,
  vscodeUri,
} from 'vite-plugin-checker-vls'

import chalk from 'chalk'
// import chokidar from 'chokidar'
import fs from 'fs'
import glob from 'glob'
import os from 'os'
import path from 'path'
import { Duplex } from 'stream'
import { lspDiagnosticToViteError, range2Location, uriToAbsPath } from 'vite-plugin-checker'
// import { VLS } from 'vls'
const { VLS } = vls
import { PublishDiagnosticsParams } from 'vscode-languageclient/node'
const {
  createConnection,
  createProtocolConnection,
  // DiagnosticSeverity,
  DidChangeTextDocumentNotification,
  DidOpenTextDocumentNotification,
  // InitializeParams,
  InitializeRequest,
  // InitializeResult,
  // Logger,
  // ServerCapabilities,
  StreamMessageReader,
  StreamMessageWriter,
} = vscodeLanguageserverNode

type Diagnostic = vscodeLanguageserverNode.Diagnostic
type InitializeParams = vscodeLanguageserverNode.InitializeParams
type InitializeResult = vscodeLanguageserverNode.InitializeResult
type Logger = vscodeLanguageserverNode.Logger
type ServerCapabilities = vscodeLanguageserverNode.ServerCapabilities

// type URI = vscodeUri.URI
// const { URI } = vscodeUri
// import { URI } from 'vscode-uri'

import { codeFrameColumns } from '@babel/code-frame'

import { getInitParams } from '../initParams'

// import type { TextDocument } from 'vscode-languageserver-textdocument'
type TextDocument = vscodeLanguageserverTextdocument.TextDocument

enum DOC_VERSION {
  init = -1,
}

export type LogLevel = typeof logLevels[number]
export const logLevels = ['ERROR', 'WARN', 'INFO', 'HINT'] as const

let disposeSuppressConsole: ReturnType<typeof suppressConsole>

const logLevel2Severity = {
  ERROR: vscodeLanguageserverNode.DiagnosticSeverity.Error,
  WARN: vscodeLanguageserverNode.DiagnosticSeverity.Warning,
  INFO: vscodeLanguageserverNode.DiagnosticSeverity.Information,
  HINT: vscodeLanguageserverNode.DiagnosticSeverity.Hint,
}

export interface DiagnosticOptions {
  watch: boolean
  verbose: boolean
  errorCallback?: (
    diagnostic: PublishDiagnosticsParams,
    viteError: ReturnType<typeof lspDiagnosticToViteError>
  ) => void
}

export async function diagnostics(
  workspace: string | null,
  logLevel: LogLevel,
  options: DiagnosticOptions = { watch: false, verbose: false }
) {
  const { watch, errorCallback } = options
  if (options.verbose) {
    console.log('====================================')
    console.log('Getting Vetur diagnostics')
  }
  let workspaceUri

  if (workspace) {
    const absPath = path.resolve(process.cwd(), workspace)
    console.log(`Loading Vetur in workspace path: ${chalk.green(absPath)}`)
    workspaceUri = vscodeUri.URI.file(absPath)
  } else {
    console.log(`Loading Vetur in current directory: ${chalk.green(process.cwd())}`)
    workspaceUri = vscodeUri.URI.file(process.cwd())
  }

  const errCount = await getDiagnostics(workspaceUri, logLevel2Severity[logLevel], options)

  if (options.verbose) {
    console.log('====================================')
  }

  // initial report
  if (!errCount) {
    console.log(chalk.green(`[VLS checker] No error found`))
    if (!watch) {
      process.exit(0)
    }
  } else {
    console.log(chalk.red(`[VLS checker] Found ${errCount} ${errCount === 1 ? 'error' : 'errors'}`))
    if (!watch) {
      process.exit(1)
    }
  }
}

class NullLogger implements Logger {
  public error(_message: string): void {}
  public warn(_message: string): void {}
  public info(_message: string): void {}
  public log(_message: string): void {}
}

class TestStream extends Duplex {
  public _write(chunk: string, _encoding: string, done: () => void) {
    this.emit('data', chunk)
    done()
  }
  public _read(_size: number) {}
}

function suppressConsole() {
  let disposed = false
  const rawConsoleLog = globalThis.console.log
  globalThis.console.log = () => {}

  return () => {
    if (disposed) return

    disposed = true
    globalThis.console.log = rawConsoleLog
  }
}

async function prepareClientConnection(workspaceUri: vscodeUri.URI, options: DiagnosticOptions) {
  const up = new TestStream()
  const down = new TestStream()
  const logger = new NullLogger()

  const clientConnection = createProtocolConnection(
    new StreamMessageReader(down),
    new StreamMessageWriter(up),
    logger
  )

  const serverConnection = createConnection(
    new StreamMessageReader(up),
    new StreamMessageWriter(down)
  )

  // hijack sendDiagnostics
  serverConnection.sendDiagnostics = (diagnostics) => {
    disposeSuppressConsole?.()
    if (diagnostics.version === DOC_VERSION.init) {
      return
    }

    if (!diagnostics.diagnostics.length) {
      prettyDiagnosticsLog({
        diagnostics: [],
        absFilePath: '',
        fileText: '',
        showNoError: false,
      })
      return
    }

    const overlayErr = lspDiagnosticToViteError(diagnostics)
    if (!overlayErr) return

    prettyDiagnosticsLog({
      diagnostics: diagnostics.diagnostics,
      absFilePath: uriToAbsPath(diagnostics.uri),
      fileText: overlayErr.fileText,
      showNoError: false,
    })

    options.errorCallback?.(diagnostics, overlayErr)
  }

  const vls = new VLS(serverConnection as any)

  vls.validateTextDocument = async (textDocument: TextDocument, cancellationToken?: any) => {
    const diagnostics = await vls.doValidate(textDocument, cancellationToken)
    if (diagnostics) {
      // @ts-ignore
      vls.lspConnection.sendDiagnostics({
        uri: textDocument.uri,
        version: textDocument.version,
        diagnostics,
      })
    }
  }

  serverConnection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
    await vls.init(params)

    if (options.verbose) {
      console.log('Vetur initialized')
      console.log('====================================')
    }

    return {
      capabilities: vls.capabilities as ServerCapabilities,
    }
  })

  vls.listen()
  clientConnection.listen()

  const init = getInitParams(workspaceUri)

  await clientConnection.sendRequest(InitializeRequest.type, init)

  return clientConnection
}

async function getDiagnostics(
  workspaceUri: vscodeUri.URI,
  severity: vscodeLanguageserverNode.DiagnosticSeverity,
  options: DiagnosticOptions
) {
  const clientConnection = await prepareClientConnection(workspaceUri, options)

  const files = glob.sync('**/*.vue', { cwd: workspaceUri.fsPath, ignore: ['node_modules/**'] })

  if (files.length === 0) {
    console.log('No input files')
    return 0
  }

  if (options.verbose) {
    console.log('')
    console.log('Getting diagnostics from: ', files, '\n')
  }

  const absFilePaths = files.map((f) => path.resolve(workspaceUri.fsPath, f))

  // initial diagnostics report
  // watch mode will run this full diagnostic at starting
  let initialErrCount = 0
  let logChunk = ''

  if (options.watch) {
    disposeSuppressConsole = suppressConsole()
  }

  for (const absFilePath of absFilePaths) {
    const fileText = fs.readFileSync(absFilePath, 'utf-8')
    clientConnection.sendNotification(DidOpenTextDocumentNotification.type, {
      textDocument: {
        languageId: 'vue',
        uri: vscodeUri.URI.file(absFilePath).toString(),
        version: DOC_VERSION.init,
        text: fileText,
      },
    })

    // logout in build mode
    if (!options.watch) {
      try {
        let diagnostics = (await clientConnection.sendRequest('$/getDiagnostics', {
          uri: vscodeUri.URI.file(absFilePath).toString(),
          version: DOC_VERSION.init,
        })) as Diagnostic[]

        /**
         * Ignore eslint errors for now
         */
        diagnostics = diagnostics
          .filter((r) => r.source !== 'eslint-plugin-vue')
          .filter((r) => r.severity && r.severity <= severity)

        if (diagnostics.length > 0) {
          logChunk += prettyDiagnosticsLog({
            absFilePath,
            fileText,
            diagnostics: diagnostics,
            doLog: false,
          })

          diagnostics.forEach((d) => {
            if (d.severity === vscodeLanguageserverNode.DiagnosticSeverity.Error) {
              initialErrCount++
            }
          })
        }
      } catch (err) {
        console.error(err.stack)
      }
    }
  }

  // watched diagnostics report
  if (options.watch) {
    chokidar
      .watch(workspaceUri.fsPath, {
        ignored: (path: string) => path.includes('node_modules'),
        ignoreInitial: false,
      })
      .on('all', (event, path) => {
        if (!path.endsWith('.vue')) return
        clientConnection.sendNotification(DidChangeTextDocumentNotification.type, {
          textDocument: {
            uri: vscodeUri.URI.file(path).toString(),
            version: Date.now(),
          },
          contentChanges: [{ text: fs.readFileSync(path, 'utf-8') }],
        })
      })
  }

  console.log(logChunk)
  return initialErrCount
}

function composeLspLog({
  diagnostic,
  absFilePath,
  fileText,
}: {
  diagnostic: Diagnostic
  absFilePath: string
  fileText: string
}) {
  let logChunk = ''
  const location = range2Location(diagnostic.range)
  logChunk += `${os.EOL}${chalk.green.bold('FILE ')} ${absFilePath}:${location.start.line}:${
    location.start.column
  }${os.EOL}`

  if (diagnostic.severity === vscodeLanguageserverNode.DiagnosticSeverity.Error) {
    logChunk += `${chalk.red.bold('ERROR ')} ${diagnostic.message.trim()}`
  } else {
    logChunk += `${chalk.yellow.bold('WARN ')} ${diagnostic.message.trim()}`
  }

  logChunk += os.EOL + os.EOL
  logChunk += codeFrameColumns(fileText, location)
  return logChunk
}

export function prettyDiagnosticsLog({
  diagnostics,
  fileText,
  absFilePath,
  doLog = true,
  showNoError = true,
}: {
  diagnostics: Diagnostic[]
  fileText: string
  absFilePath: string
  /** does log to terminal */
  doLog?: boolean
  showNoError?: boolean
}) {
  if (!diagnostics.length && showNoError) {
    doLog && console.log(chalk.green(`[VLS checker] No error found`))
    return ''
  }

  const logs = diagnostics.map((d) => {
    return composeLspLog({
      diagnostic: d,
      absFilePath,
      fileText,
    })
  })

  let logChunk = logs.join(os.EOL) + os.EOL
  doLog && console.log(logChunk)
  return logChunk
}
