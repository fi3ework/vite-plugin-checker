import type { UserConfig, ViteDevServer } from 'vite'
import { CheckerFactory, CreateDiagnostic, PluginOptions } from 'vite-plugin-ts-checker'
import { diagnostics, logLevels } from './commands/diagnostics'

export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  let overlay = true // Vite defaults to true

  return {
    config: (config: UserConfig) => {
      const hmr = config.server?.hmr
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (userOptions.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer(server: ViteDevServer) {
      const workDir: string = userOptions.root ?? server.config.root
      await diagnostics(workDir, 'WARN', true)
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
