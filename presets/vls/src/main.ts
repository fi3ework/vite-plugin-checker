import type { UserConfig, ViteDevServer } from 'vite'
import { CheckerFactory, CreateDiagnostic, PluginOptions } from 'vite-plugin-ts-checker'

export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  return {
    config: (config: UserConfig) => {
      // TODO:
    },
    configureServer(server: ViteDevServer) {
      // TODO:
    },
  }
}

export const vlsCheckerFactory: CheckerFactory = () => {
  return {
    buildBin: ['vite-plugin-ts-checker-preset-vls', ['diagnostics']],
    createDiagnostic: createDiagnostic,
  }
}

export default vlsCheckerFactory
