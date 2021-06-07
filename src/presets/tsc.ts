import os from 'os'
import ts from 'typescript'
import { ErrorPayload } from 'vite'
import { isMainThread, parentPort, Worker, workerData } from 'worker_threads'

import { ACTION_TYPES } from '../types'
import { ensureCall, formatHost, tsDiagnosticToViteError } from '../utils'

import type {
  CheckWorker,
  ConfigAction,
  ConfigureServerAction,
  CreateDiagnostic,
  CheckerFactory,
  DiagnosticOfCheck,
  BuildCheckBin,
} from '../types'
/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  let overlay = true // Vite defaults to true
  let currErr: ErrorPayload['err'] | null = null

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (userOptions.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    configureServer({ root }) {
      const finalConfig = {
        root: userOptions.root ?? root,
        tsconfigPath: userOptions.tsconfigPath ?? 'tsconfig.json',
      }

      let configFile: string | undefined

      configFile = ts.findConfigFile(finalConfig.root, ts.sys.fileExists, finalConfig.tsconfigPath)

      if (configFile === undefined) {
        throw Error(
          `Failed to find a valid tsconfig.json: ${finalConfig.tsconfigPath} at ${finalConfig.root} is not a valid tsconfig`
        )
      }

      // https://github.com/microsoft/TypeScript/blob/a545ab1ac2cb24ff3b1aaf0bfbfb62c499742ac2/src/compiler/watch.ts#L12-L28
      const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
        const originalDiagnostic = ts.formatDiagnosticsWithColorAndContext([diagnostic], formatHost)

        if (!currErr) {
          currErr = tsDiagnosticToViteError(diagnostic)
        }

        ensureCall(() => {
          ts.sys.write(originalDiagnostic)
        })
      }

      const reportWatchStatusChanged: ts.WatchStatusReporter = (
        diagnostic
        // newLine,
        // options,
        // errorCount
        // eslint-disable-next-line max-params
      ) => {
        // https://github.com/microsoft/TypeScript/issues/32542
        switch (diagnostic.code) {
          case 6032: // Incremental build
            // clear current error and use the newer errors
            currErr = null
            break
          case 6031: // Initial build
          case 6193: // 1 Error
          case 6194: // 0 errors or 2+ errors
            if (currErr && overlay) {
              parentPort?.postMessage({
                type: 'ERROR',
                payload: {
                  type: 'error',
                  err: currErr,
                },
              })

              // server.ws.send({
              //   type: 'error',
              //   err: currErr,
              // })
            }

            ensureCall(() => {
              ts.sys.write(os.EOL + os.EOL + diagnostic.messageText.toString())
            })
        }
      }

      // https://github.com/microsoft/TypeScript/issues/32385
      // https://github.com/microsoft/TypeScript/pull/33082/files
      const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram
      const host = ts.createWatchCompilerHost(
        configFile,
        { noEmit: true },
        ts.sys,
        createProgram,
        reportDiagnostic,
        reportWatchStatusChanged
      )

      ts.createWatchProgram(host)
    },
  }
}

const checkerFactory: CheckerFactory = () => {
  return {
    createDiagnostic,
  }
}

if (isMainThread) {
  // initialized in main thread
  const createWorker = (userConfigs?: Record<string, never>): CheckWorker => {
    const worker = new Worker(__filename, {
      workerData: userConfigs,
    })

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      worker,
      config: (config) => {
        const configAction: ConfigAction = { type: ACTION_TYPES.config, payload: config }
        worker.postMessage(configAction)
      },
      configureServer: (serverConfig) => {
        const configureServerAction: ConfigureServerAction = {
          type: ACTION_TYPES.configureServer,
          payload: serverConfig,
        }
        worker.postMessage(configureServerAction)
      },
    }
  }

  module.exports.createWorker = createWorker
} else {
  // runs in worker thread
  let diagnostic: DiagnosticOfCheck | null = null
  if (!parentPort) throw Error('should have parentPort as file runs in worker thread')

  parentPort.on('message', (action: ConfigAction | ConfigureServerAction) => {
    if (action.type === ACTION_TYPES.config) {
      const checker = checkerFactory()
      const userConfigs = workerData
      diagnostic = checker.createDiagnostic(userConfigs)
      diagnostic.config(action.payload)
    } else if (action.type === ACTION_TYPES.configureServer) {
      if (!diagnostic) throw Error('diagnostic should be initialized in `config` hook of Vite')
      diagnostic.configureServer(action.payload)
    }
  })
}

export const buildBin: BuildCheckBin = ['tsc', ['--noEmit']]
