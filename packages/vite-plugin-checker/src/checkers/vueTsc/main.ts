import { isMainThread } from 'worker_threads'

import { createScript } from '../../worker'

import type { PluginConfig, CreateDiagnostic } from '../../types'
import type { UserConfig, ViteDevServer } from 'vite'

// TODO: watch mode is not supported for now
// we will wait for vue-tsc

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 *
 */
// @ts-ignore
export const createDiagnostic: CreateDiagnostic<Pick<PluginConfig, 'vueTsc'>> = (checkerConfig) => {
  return {
    config: (config: UserConfig) => {
      //
    },
    configureServer(server: ViteDevServer) {
      //
    },
  }
}

const { mainScript, workerScript } = createScript<Pick<PluginConfig, 'vueTsc'>>({
  absFilename: __filename,
  buildBin: ['vue-tsc', ['--noEmit']],
  serverChecker: { createDiagnostic },
})!

if (isMainThread) {
  const createServeAndBuild = mainScript()
  module.exports.createServeAndBuild = createServeAndBuild
} else {
  workerScript()
}
