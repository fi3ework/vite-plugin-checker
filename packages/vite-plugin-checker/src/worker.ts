import type { ConfigEnv } from 'vite'
import { parentPort, Worker, workerData } from 'node:worker_threads'

import { ACTION_TYPES } from './types.js'

import type {
  ServeChecker,
  ConfigureServeChecker,
  ConfigAction,
  ConfigureServerAction,
  CheckerDiagnostic,
  BuildCheckBin,
  ServeAndBuildChecker,
  UnrefAction,
  CreateServeAndBuildParams,
} from './types.js'

interface WorkerScriptOptions<T = unknown> {
  absFilename: string
  buildBin: BuildCheckBin<T>
  serverChecker: ServeChecker<T>
}

export interface Script<T = unknown> {
  mainScript: () => (things: CreateServeAndBuildParams) => ServeAndBuildChecker<T>
  workerScript: () => void
}

export function createScript<T = unknown>({
  absFilename,
  buildBin,
  serverChecker,
}: WorkerScriptOptions<T>): Script<T> {
  return {
    mainScript: () => {
      // initialized in main thread
      const createServe = ({ env }: { env: ConfigEnv }): ConfigureServeChecker => {
        const isBuild = env.command === 'build'
        const worker = new Worker(absFilename, {
          workerData: { env },
        })

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          worker,
          config: (things: CreateServeAndBuildParams) => {
            if (isBuild) return // just run the command

            const configAction: ConfigAction = {
              type: ACTION_TYPES.config,
              payload: things,
            }
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

      return (things: CreateServeAndBuildParams) => {
        return {
          serve: createServe(things),
          build: { buildBin },
        }
      }
    },
    workerScript: () => {
      // runs in worker thread
      let diagnostic: CheckerDiagnostic<T> | null = null
      if (!parentPort) throw Error('should have parentPort as file runs in worker thread')
      const isBuild = workerData.env.command === 'build'
      // only run bin command and do not listen message in build mode

      const port = parentPort.on(
        'message',
        (action: ConfigAction<T> | ConfigureServerAction | UnrefAction) => {
          switch (action.type) {
            case ACTION_TYPES.config: {
              diagnostic = serverChecker.createDiagnostic()
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
