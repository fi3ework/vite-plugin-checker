import { ConfigEnv } from 'vite'
import { parentPort, Worker, workerData } from 'worker_threads'

import { ACTION_TYPES } from './types'

import type {
  ServeChecker,
  ConfigureServeChecker,
  ConfigAction,
  ConfigureServerAction,
  CheckerDiagnostic,
  BuildCheckBin,
  ServeAndBuildChecker,
  SharedConfig,
  UnrefAction,
} from './types'
interface WorkerScriptOptions {
  absFilename: string
  buildBin: BuildCheckBin
  serverChecker: ServeChecker
}

interface Script<T> {
  mainScript: () => (config: T & SharedConfig, env: ConfigEnv) => ServeAndBuildChecker
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
      const createWorker = (
        checkerConfig: CheckerConfig,
        env: ConfigEnv
      ): ConfigureServeChecker => {
        const isBuild = env.command === 'build'
        const worker = new Worker(absFilename, {
          workerData: { env, checkerConfig, columns: process.stdout.columns },
        })

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          worker,
          config: (config) => {
            if (isBuild) return // just run the command

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

      return (config, env) => ({
        serve: createWorker(config, env),
        build: { buildBin },
      })
    },
    workerScript: () => {
      // runs in worker thread
      let diagnostic: CheckerDiagnostic | null = null
      if (!parentPort) throw Error('should have parentPort as file runs in worker thread')
      const isBuild = workerData.env.command === 'build'
      process.stdout.columns = workerData.columns
      // only run bin command and do not listen message in build mode

      const port = parentPort.on(
        'message',
        (action: ConfigAction | ConfigureServerAction | UnrefAction) => {
          switch (action.type) {
            case ACTION_TYPES.config: {
              const checkerConfig: T = workerData.checkerConfig
              diagnostic = serverChecker.createDiagnostic(checkerConfig)
              diagnostic.config(action.payload)
              break
            }
            case ACTION_TYPES.configureServer:
              if (!diagnostic)
                throw Error('diagnostic should be initialized in `config` hook of Vite')
              diagnostic.configureServer(action.payload)
              break
            case ACTION_TYPES.unref:
              port.unref()
              break
          }
        }
      )

      if (isBuild) {
        port.unref()
      }
    },
  }
}
