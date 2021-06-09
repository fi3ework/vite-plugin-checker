import { parentPort, Worker, workerData } from 'worker_threads'
import type {
  // ServeCheckerFactory,
  ServeChecker,
  ConfigureServeChecker,
  ConfigAction,
  ConfigureServerAction,
  CheckerDiagnostic,
  BuildCheckBin,
  ServeAndBuildChecker,
  SharedConfig,
} from './types'
import { ACTION_TYPES } from './types'

interface WorkerScriptOptions {
  absFilename: string
  buildBin: BuildCheckBin
  serverChecker: ServeChecker
}

interface Script<T> {
  mainScript: () => (config: T & SharedConfig) => ServeAndBuildChecker
  workerScript: () => void
}

export function createScript<T>({
  absFilename,
  buildBin,
  serverChecker,
}: WorkerScriptOptions): Script<T> {
  type CheckerConfig = T & SharedConfig
  return {
    mainScript: () => {
      // initialized in main thread
      const createWorker = (checkerConfig?: CheckerConfig): ConfigureServeChecker => {
        const worker = new Worker(absFilename, {
          workerData: checkerConfig,
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

      return (config) => ({
        serve: createWorker(config),
        build: { buildBin },
      })
    },
    workerScript: () => {
      // runs in worker thread
      let diagnostic: CheckerDiagnostic | null = null
      if (!parentPort) throw Error('should have parentPort as file runs in worker thread')

      parentPort.on('message', (action: ConfigAction | ConfigureServerAction) => {
        if (action.type === ACTION_TYPES.config) {
          // const checker = checkerFactory()
          const checkerConfig: T = workerData
          diagnostic = serverChecker.createDiagnostic(checkerConfig)
          diagnostic.config(action.payload)
        } else if (action.type === ACTION_TYPES.configureServer) {
          if (!diagnostic) throw Error('diagnostic should be initialized in `config` hook of Vite')
          diagnostic.configureServer(action.payload)
        }
      })
    },
  }
}
