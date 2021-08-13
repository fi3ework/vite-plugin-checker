import chalk from 'chalk'
import glob from 'fast-glob'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Duplex } from 'stream'
import { VLS } from 'vls'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  createConnection,
  createProtocolConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeTextDocumentNotification,
  DidChangeWatchedFilesNotification,
  DidOpenTextDocumentNotification,
  InitializeParams,
  InitializeRequest,
  InitializeResult,
  Logger,
  PublishDiagnosticsParams,
  ServerCapabilities,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-languageserver/node'
import { URI } from 'vscode-uri'

import { Checker } from '../../Checker'
import { DiagnosticCache } from '../../DiagnosticCache'
import {
  diagnosticToTerminalLog,
  diagnosticToViteError,
  normalizeLspDiagnostic,
  normalizePublishDiagnosticParams,
} from '../../logger'
import { getInitParams } from './initParams'

import type { ErrorPayload } from 'vite'

enum DOC_VERSION {
  init = -1,
}

export type LogLevel = typeof logLevels[number]
export const logLevels = ['ERROR', 'WARN', 'INFO', 'HINT'] as const

let disposeSuppressConsole: ReturnType<typeof suppressConsole>

const diagnosticCache = new DiagnosticCache()

const logLevel2Severity = {
  ERROR: DiagnosticSeverity.Error,
  WARN: DiagnosticSeverity.Warning,
  INFO: DiagnosticSeverity.Information,
  HINT: DiagnosticSeverity.Hint,
}

export interface DiagnosticOptions {
  watch: boolean
  verbose: boolean
  errorCallback?: (diagnostic: PublishDiagnosticsParams, viteError: ErrorPayload['err']) => void
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
    workspaceUri = URI.file(absPath)
  } else {
    console.log(`Loading Vetur in current directory: ${chalk.green(process.cwd())}`)
    workspaceUri = URI.file(process.cwd())
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

async function prepareClientConnection(workspaceUri: URI, options: DiagnosticOptions) {
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
  serverConnection.sendDiagnostics = async (publishDiagnostics) => {
    disposeSuppressConsole?.()
    if (publishDiagnostics.version === DOC_VERSION.init) {
      return
    }

    // if (!publishDiagnostics.diagnostics.length) {
    //   return
    // }
    const absFilePath = URI.parse(publishDiagnostics.uri).fsPath
    const next = await normalizePublishDiagnosticParams(publishDiagnostics)
    // console.log(absFilePath, next)
    diagnosticCache.set(absFilePath, next)

    // log in terminal
    // console.log(os.EOL)
    const res = diagnosticCache.get()
    console.log(res.map((d) => diagnosticToTerminalLog(d, 'VLS')).join(os.EOL))
    // console.log(next.map((d) => diagnosticToTerminalLog(d, 'VLS')).join(os.EOL))
    // log to error overlay
    if (diagnosticCache.last) {
      const normalized = diagnosticToViteError(diagnosticCache.last)
      options.errorCallback?.(publishDiagnostics, normalized)
    }
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

function extToGlobs(exts: string[]) {
  return exts.map((e) => '**/*' + e).join(',')
}

const watchedDidChangeContent = ['.vue']
const watchedDidChangeWatchedFiles = ['.js', '.ts', '.json']
const watchedDidChangeContentGlob = extToGlobs(watchedDidChangeContent)
const watchedDidChangeWatchedFilesGlob = extToGlobs(watchedDidChangeWatchedFiles)

async function getDiagnostics(
  workspaceUri: URI,
  severity: DiagnosticSeverity,
  options: DiagnosticOptions
) {
  const clientConnection = await prepareClientConnection(workspaceUri, options)
  const files = glob.sync(`{${watchedDidChangeContentGlob},${watchedDidChangeWatchedFilesGlob}}`, {
    cwd: workspaceUri.fsPath,
    ignore: ['node_modules/**'],
  })

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

  await Promise.all(
    absFilePaths.map(async (absFilePath) => {
      const fileText = await fs.promises.readFile(absFilePath, 'utf-8')
      clientConnection.sendNotification(DidOpenTextDocumentNotification.type, {
        textDocument: {
          languageId: 'vue',
          uri: URI.file(absFilePath).toString(),
          version: DOC_VERSION.init,
          text: fileText,
        },
      })

      // log out in build mode
      if (!options.watch) {
        try {
          let diagnostics = (await clientConnection.sendRequest('$/getDiagnostics', {
            uri: URI.file(absFilePath).toString(),
            version: DOC_VERSION.init,
          })) as Diagnostic[]

          /**
           * Ignore eslint errors for now
           */
          diagnostics = diagnostics
            .filter((r) => r.source !== 'eslint-plugin-vue')
            .filter((r) => r.severity && r.severity <= severity)

          if (diagnostics.length > 0) {
            logChunk +=
              os.EOL +
              diagnostics
                .map((d) =>
                  diagnosticToTerminalLog(
                    normalizeLspDiagnostic({
                      diagnostic: d,
                      absFilePath,
                      fileText,
                    }),
                    'VLS'
                  )
                )
                .join(os.EOL)

            diagnostics.forEach((d) => {
              if (d.severity === DiagnosticSeverity.Error) {
                initialErrCount++
              }
            })
          }
        } catch (err) {
          console.error(err.stack)
        }
      }
    })
  )

  // watched diagnostics report
  if (options.watch) {
    Checker.watcher.add(workspaceUri.fsPath)
    Checker.watcher.on('all', async (event, filePath) => {
      const extname = path.extname(filePath)

      // .vue file changed
      if (watchedDidChangeContent.includes(extname)) {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8')
        clientConnection.sendNotification(DidChangeTextDocumentNotification.type, {
          textDocument: {
            uri: URI.file(filePath).toString(),
            version: Date.now(),
          },
          contentChanges: [{ text: fileContent }],
        })
      }

      // .js,.ts,.json file changed
      if (watchedDidChangeWatchedFiles.includes(extname)) {
        clientConnection.sendNotification(DidChangeWatchedFilesNotification.type, {
          changes: [
            {
              uri: URI.file(filePath).toString(),
              type: event === 'add' ? 1 : event === 'unlink' ? 3 : 2,
            },
          ],
        })
      }
    })
  }

  console.log(logChunk)
  return initialErrCount
}
