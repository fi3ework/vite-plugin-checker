import { CreateDiagnostic } from '../types'

import type { CheckerFactory } from '../types'
import type { UserConfig, ViteDevServer } from 'vite'

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  return {
    config: (config: UserConfig) => {
      // TODO: watch mode is note supported
    },
    configureServer(server: ViteDevServer) {
      // TODO: watch mode is note supported
    },
  }
}

export const checkerFactory: CheckerFactory = () => {
  return {
    buildBin: ['vue-tsc', ['--noEmit']],
    createDiagnostic: createDiagnostic,
  }
}

export type VueTscCheckerOptions = Record<string, never>
