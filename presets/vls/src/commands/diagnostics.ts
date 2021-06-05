import chalk from 'chalk'
import chokidar from 'chokidar'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { Duplex } from 'stream'
import { range2Location } from 'vite-plugin-ts-checker'
import { VLS } from 'vls'
import { PublishDiagnosticsParams } from 'vscode-languageclient/node'
import {
  createConnection,
  createProtocolConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeTextDocumentNotification,
  DidOpenTextDocumentNotification,
  InitializeParams,
  InitializeRequest,
  InitializeResult,
  Logger,
  ServerCapabilities,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-languageserver/node'
import { URI } from 'vscode-uri'

import { codeFrameColumns } from '@babel/code-frame'

import { getInitParams } from '../initParams'

export type LogLevel = typeof logLevels[number]
export const logLevels = ['ERROR', 'WARN', 'INFO', 'HINT'] as const
const logLevel2Severity = {
  ERROR: DiagnosticSeverity.Error,
  WARN: DiagnosticSeverity.Warning,
  INFO: DiagnosticSeverity.Information,
  HINT: DiagnosticSeverity.Hint,
}

export interface DiagnosticOptions {
  watch: boolean
  errorCallback?: (diagnostic: PublishDiagnosticsParams) => void
}

export async function diagnostics(
  workspace: string | null,
  logLevel: LogLevel,
  options: DiagnosticOptions = { watch: false }
) {
  const { watch, errorCallback } = options
  console.log('====================================')
  console.log('Getting Vetur diagnostics')
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
  console.log('====================================')

  if (errCount === 0) {
    console.log(chalk.green(`VTI found no error`))
    if (!watch) {
      process.exit(0)
    }
  } else {
    console.log(chalk.red(`VTI found ${errCount} ${errCount === 1 ? 'error' : 'errors'}`))
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

  // NOTE: hijack sendDiagnostics
  serverConnection.sendDiagnostics = (diagnostic) => {
    options.errorCallback?.(diagnostic)
  }

  const vls = new VLS(serverConnection as any)

  serverConnection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
    await vls.init(params)

    console.log('Vetur initialized')
    console.log('====================================')

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
  workspaceUri: URI,
  severity: DiagnosticSeverity,
  options: DiagnosticOptions
) {
  const clientConnection = await prepareClientConnection(workspaceUri, options)

  const files = glob.sync('**/*.vue', { cwd: workspaceUri.fsPath, ignore: ['node_modules/**'] })

  if (files.length === 0) {
    console.log('No input files')
    return 0
  }

  // console.log('')
  // console.log('Getting diagnostics from: ', files, '\n')

  const absFilePaths = files.map((f) => path.resolve(workspaceUri.fsPath, f))

  let errCount = 0

  // watched diagnostics
  if (options.watch) {
    chokidar
      .watch(workspaceUri.fsPath, {
        ignored: (path: string) => path.includes('node_modules'),
        ignoreInitial: true,
      })
      .on('all', (event, path) => {
        if (!path.endsWith('.vue')) return
        clientConnection.sendNotification(DidChangeTextDocumentNotification.type, {
          textDocument: {
            uri: URI.file(path).toString(),
            version: Date.now(),
          },
          contentChanges: [{ text: fs.readFileSync(path, 'utf-8') }],
        })
      })
  }

  // initial diagnostics
  for (const absFilePath of absFilePaths) {
    const fileText = fs.readFileSync(absFilePath, 'utf-8')
    clientConnection.sendNotification(DidOpenTextDocumentNotification.type, {
      textDocument: {
        languageId: 'vue',
        uri: URI.file(absFilePath).toString(),
        version: 1,
        text: fileText,
      },
    })

    try {
      let res = (await clientConnection.sendRequest('$/getDiagnostics', {
        uri: URI.file(absFilePath).toString(),
      })) as Diagnostic[]
      /**
       * Ignore eslint errors for now
       */
      res = res
        .filter((r) => r.source !== 'eslint-plugin-vue')
        .filter((r) => r.severity && r.severity <= severity)
      if (res.length > 0) {
        res.forEach((d) => {
          const location = range2Location(d.range)
          console.log(
            `${chalk.green('File')} : ${chalk.green(absFilePath)}:${location.start.line}:${
              location.start.column
            }`
          )
          if (d.severity === DiagnosticSeverity.Error) {
            console.log(`${chalk.red('Error')}: ${d.message.trim()}`)
            errCount++
          } else {
            console.log(`${chalk.yellow('Warn')} : ${d.message.trim()}`)
          }
          console.log(codeFrameColumns(fileText, location))
        })
        console.log('')
      }
    } catch (err) {
      console.error(err.stack)
    }
  }

  return errCount
}
