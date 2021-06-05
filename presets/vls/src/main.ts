import type { UserConfig, ViteDevServer } from 'vite'
import { CheckerFactory, CreateDiagnostic, lspDiagnosticToViteError } from 'vite-plugin-ts-checker'

import { codeFrameColumns } from '@babel/code-frame'

import { DiagnosticOptions, diagnostics } from './commands/diagnostics'

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
      const errorCallback: DiagnosticOptions['errorCallback'] = (d) => {
        if (!d.diagnostics.length) return
        const firstDiagnostic = d.diagnostics[0]

        codeFrameColumns(firstDiagnostic.source || 'no code', {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 1 },
        })

        const overlayErr = lspDiagnosticToViteError(d)
        if (!overlayErr) return
        server.ws.send({
          type: 'error',
          err: overlayErr,
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
