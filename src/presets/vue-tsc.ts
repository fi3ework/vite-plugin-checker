import { isMainThread } from 'worker_threads'
import { createScript } from '../worker'

import type { ServeCheckerFactory, CreateDiagnostic, BuildCheckBin } from '../types'
import type { UserConfig, ViteDevServer } from 'vite'

// TODO: watch mode is not supported for now
// we will wait for vue-tsc

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

export const checkerFactory: ServeCheckerFactory = () => {
  return {
    buildBin: ['vue-tsc', ['--noEmit']],
    createDiagnostic: createDiagnostic,
  }
}

const { mainScript, workerScript } = createScript({
  absFilename: __filename,
  buildBin,
  checkerFactory,
})!

if (isMainThread) {
  const { createWorker, serveAndBuild } = mainScript()
  module.exports.createWorker = createWorker
  module.exports.serveAndBuild = serveAndBuild
} else {
  workerScript()
}
