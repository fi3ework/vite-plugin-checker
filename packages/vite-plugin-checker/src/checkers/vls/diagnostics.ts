import chalk from 'chalk'
import chokidar from 'chokidar'
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

import {
  consoleLog,
  diagnosticToTerminalLog,
  diagnosticToViteError,
  normalizeLspDiagnostic,
  normalizePublishDiagnosticParams,
} from '../../logger'
import { DeepPartial } from '../../types'
import { getInitParams, VlsOptions } from './initParams'

import type { ErrorPayload } from 'vite'
import { FileDiagnosticCache } from '../../DiagnosticCache'
enum DOC_VERSION {
  init = -1,
}

export type LogLevel = typeof logLevels[number]
export const logLevels = ['ERROR', 'WARN', 'INFO', 'HINT'] as const

let disposeSuppressConsole: ReturnType<typeof suppressConsole>
const diagnosticCache = new FileDiagnosticCache()

export const logLevel2Severity = {
  ERROR: DiagnosticSeverity.Error,
  WARN: DiagnosticSeverity.Warning,
  INFO: DiagnosticSeverity.Information,
  HINT: DiagnosticSeverity.Hint,
}

export interface DiagnosticOptions {
  watch: boolean
  verbose: boolean
  config: DeepPartial<VlsOptions> | null
  errorCallback?: (diagnostic: PublishDiagnosticsParams, viteError: ErrorPayload['err']) => void
}

export async function diagnostics(
  workspace: string | null,
  logLevel: LogLevel,
  options: DiagnosticOptions = { watch: false, verbose: false, config: null }
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
    vlsConsoleLog(chalk.green(`[VLS checker] No error found`))
    if (!watch) {
      process.exit(0)
    }
  } else {
    vlsConsoleLog(
      chalk.red(`[VLS checker] Found ${errCount} ${errCount === 1 ? 'error' : 'errors'}`)
    )
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

export class TestStream extends Duplex {
  public _write(chunk: string, _encoding: string, done: () => void) {
    this.emit('data', chunk)
    done()
  }
  public _read(_size: number) {}
}

let vlsConsoleLog = consoleLog

function suppressConsole() {
  let disposed = false
  const rawConsoleLog = vlsConsoleLog
  vlsConsoleLog = () => {}

  return () => {
    if (disposed) return

    disposed = true
    vlsConsoleLog = rawConsoleLog
  }
}

export async function prepareClientConnection(
  workspaceUri: URI,
  severity: DiagnosticSeverity,
  options: DiagnosticOptions
) {
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

    const absFilePath = URI.parse(publishDiagnostics.uri).fsPath
    publishDiagnostics.diagnostics = filterDiagnostics(publishDiagnostics.diagnostics, severity)
    const nextDiagnosticInFile = await normalizePublishDiagnosticParams(publishDiagnostics)
    diagnosticCache.setFile(absFilePath, nextDiagnosticInFile)

    const res = diagnosticCache.getDiagnostics()
    vlsConsoleLog(os.EOL)
    vlsConsoleLog(res.map((d) => diagnosticToTerminalLog(d, 'VLS')).join(os.EOL))

    if (diagnosticCache.lastDiagnostic) {
      const normalized = diagnosticToViteError(diagnosticCache.lastDiagnostic)
      options.errorCallback?.(publishDiagnostics, normalized)
    }
  }

  const vls = new VLS(serverConnection as any)

  vls.validateTextDocument = async (textDocument: TextDocument, cancellationToken?: any) => {
    const diagnostics = await vls.doValidate(textDocument, cancellationToken)
    if (diagnostics) {
      // @ts-expect-error
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

  const initParams = getInitParams(workspaceUri)

  if (options.config) {
    // Merge in used-provided VLS settings if present
    mergeDeep(initParams.initializationOptions.config, options.config)
  }

  await clientConnection.sendRequest(InitializeRequest.type, initParams)

  return { clientConnection, serverConnection, vls, up, down, logger }
}

function extToGlobs(exts: string[]) {
  return exts.map((e) => '**/*' + e)
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
  const { clientConnection } = await prepareClientConnection(workspaceUri, severity, options)

  const files = glob.sync([...watchedDidChangeContentGlob, ...watchedDidChangeWatchedFilesGlob], {
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

      // log in build mode
      if (!options.watch) {
        try {
          let diagnostics = (await clientConnection.sendRequest('$/getDiagnostics', {
            uri: URI.file(absFilePath).toString(),
            version: DOC_VERSION.init,
          })) as Diagnostic[]

          diagnostics = filterDiagnostics(diagnostics, severity)

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
    const watcher = chokidar.watch([], {
      ignored: (path: string) => path.includes('node_modules'),
    })

    watcher.add(workspaceUri.fsPath)
    watcher.on('all', async (event, filePath) => {
      const extname = path.extname(filePath)
      // .vue file changed
      if (!filePath.endsWith('.vue')) return
      const fileContent = await fs.promises.readFile(filePath, 'utf-8')
      clientConnection.sendNotification(DidChangeTextDocumentNotification.type, {
        textDocument: {
          uri: URI.file(filePath).toString(),
          version: Date.now(),
        },
        contentChanges: [{ text: fileContent }],
      })

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

  vlsConsoleLog(logChunk)
  return initialErrCount
}

function isObject(item: any): item is {} {
  return item && typeof item === 'object' && !Array.isArray(item)
}

function mergeDeep<T>(target: T, source: DeepPartial<T> | undefined) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return target
}

function filterDiagnostics(diagnostics: Diagnostic[], severity: number): Diagnostic[] {
  /**
   * Ignore eslint errors for now
   */
  return diagnostics
    .filter((r) => r.source !== 'eslint-plugin-vue')
    .filter((r) => r.severity && r.severity <= severity)
}
