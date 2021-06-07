import type { UserConfig, ViteDevServer } from 'vite'
import {
  BuildCheckBin,
  CheckerFactory,
  CreateDiagnostic,
  lspDiagnosticToViteError,
  DiagnosticOfCheck,
  uriToAbsPath,
  CheckWorker,
  ACTION_TYPES,
  ConfigAction,
  ConfigureServerAction,
} from 'vite-plugin-ts-checker'
import { isMainThread, parentPort, Worker, workerData } from 'worker_threads'

import { DiagnosticOptions, diagnostics, prettyLspConsole } from './commands/diagnostics'

export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  let overlay = true // Vite defaults to true

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (userOptions.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer({ root }) {
      const workDir: string = userOptions.root ?? root
      const errorCallback: DiagnosticOptions['errorCallback'] = (diagnostics) => {
        if (!diagnostics.diagnostics.length) return
        const overlayErr = lspDiagnosticToViteError(diagnostics)
        if (!overlayErr) return

        parentPort?.postMessage({
          type: 'ERROR',
          payload: {
            type: 'error',
            err: overlayErr,
          },
        })
        // server.ws.send({
        //   type: 'error',
        //   err: overlayErr,
        // })
        diagnostics.diagnostics.forEach((d) => {
          prettyLspConsole({
            d,
            absFilePath: uriToAbsPath(diagnostics.uri),
            fileText: overlayErr.fileText,
          })
        })
      }

      await diagnostics(workDir, 'WARN', { watch: true, errorCallback })
    },
  }
}

const vlsCheckerFactory: CheckerFactory = () => {
  return {
    createDiagnostic: createDiagnostic,
  }
}

export const buildBin: BuildCheckBin = ['vite-plugin-ts-checker-preset-vls', ['diagnostics']]

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
  module.exports.serveAndBuild = (config: any) => ({
    serve: createWorker(config),
    build: buildBin,
  })
} else {
  // runs in worker thread
  let diagnostic: DiagnosticOfCheck | null = null
  if (!parentPort) throw Error('should have parentPort as file runs in worker thread')

  parentPort.on('message', (action: ConfigAction | ConfigureServerAction) => {
    if (action.type === ACTION_TYPES.config) {
      const checker = vlsCheckerFactory()
      const userConfigs = workerData
      diagnostic = checker.createDiagnostic(userConfigs)
      diagnostic.config(action.payload)
    } else if (action.type === ACTION_TYPES.configureServer) {
      if (!diagnostic) throw Error('diagnostic should be initialized in `config` hook of Vite')
      diagnostic.configureServer(action.payload)
    }
  })
}

declare const serveAndBuild: any
export { serveAndBuild }
