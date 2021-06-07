import { parentPort, Worker, workerData } from 'worker_threads'
import type {
  ServeCheckerFactory,
  ConfigureChecker,
  ConfigAction,
  ConfigureServerAction,
  DiagnosticOfCheck,
  BuildCheckBin,
} from './types'
import { ACTION_TYPES } from './types'

interface WorkerScriptOptions {
  absFilename: string
  buildBin: BuildCheckBin
  checkerFactory: ServeCheckerFactory
}

export function createScript({ absFilename, buildBin, checkerFactory }: WorkerScriptOptions) {
  return {
    mainScript: () => {
      // initialized in main thread
      const createWorker = (userConfigs?: Record<string, never>): ConfigureChecker => {
        const worker = new Worker(absFilename, {
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

      return {
        createWorker,
        serveAndBuild: (config: any) => ({
          serve: createWorker(config),
          build: buildBin,
        }),
      }

      // module.exports.createWorker = createWorker
      // module.exports.serveAndBuild = (config: any) => ({
      //   serve: createWorker(config),
      //   build: buildBin,
      // })
    },
    workerScript: () => {
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
    },
  }
}
