import { isMainThread, parentPort, Worker, workerData } from 'worker_threads'

import { ACTION_TYPES } from '../types'

import type {
  CheckerFactory,
  CheckWorker,
  ConfigAction,
  ConfigureServerAction,
  CreateDiagnostic,
  BuildCheckBin,
} from '../types'
import type { UserConfig, ViteDevServer } from 'vite'

//  TODO: watch mode is note supported
/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 *
 */
// @ts-ignore
export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  return {
    config: (config: UserConfig) => {
      //
    },
    configureServer(server: ViteDevServer) {
      //
    },
  }
}

export const buildBin: BuildCheckBin = ['vue-tsc', ['--noEmit']]

export const checkerFactory: CheckerFactory = () => {
  return {
    buildBin: ['vue-tsc', ['--noEmit']],
    createDiagnostic: createDiagnostic,
  }
}

// TODO: watch mode is note supported
// Nothing will happened, just satisfy type check
if (isMainThread) {
  // initialized in main thread
  const createWorker = (userConfigs?: Record<string, never>): CheckWorker => {
    const worker = new Worker(__filename, {
      workerData: userConfigs,
    })

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
  //
}
