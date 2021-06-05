import type { UserConfig, ViteDevServer } from 'vite'
import {
  CheckerFactory,
  CreateDiagnostic,
  lspDiagnosticToViteError,
  uriToAbsPath,
} from 'vite-plugin-ts-checker'

import { DiagnosticOptions, diagnostics, prettyLspConsole } from './commands/diagnostics'

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
      const errorCallback: DiagnosticOptions['errorCallback'] = (diagnostics) => {
        if (!diagnostics.diagnostics.length) return
        const overlayErr = lspDiagnosticToViteError(diagnostics)
        if (!overlayErr) return

        server.ws.send({
          type: 'error',
          err: overlayErr,
        })
        diagnostics.diagnostics.forEach((d) => {
          prettyLspConsole({
            d,
            absFilePath: uriToAbsPath(diagnostics.uri),
            fileText: overlayErr.fileText,
          })
        })
      }

      await diagnostics(workDir, 'WARN', { watch: true, errorCallback })
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
