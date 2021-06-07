import {
  BuildCheckBin,
  ServeCheckerFactory,
  CreateDiagnostic,
  createScript,
  lspDiagnosticToViteError,
  uriToAbsPath,
} from 'vite-plugin-ts-checker'
import { isMainThread, parentPort } from 'worker_threads'

import { DiagnosticOptions, diagnostics, prettyLspConsole } from './commands/diagnostics'

export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  let overlay = true // Vite defaults to true

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (userOptions.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer({ root }) {
      const workDir: string = userOptions.root ?? root
      const errorCallback: DiagnosticOptions['errorCallback'] = (diagnostics) => {
        if (!diagnostics.diagnostics.length) return
        const overlayErr = lspDiagnosticToViteError(diagnostics)
        if (!overlayErr) return

        parentPort?.postMessage({
          type: 'ERROR',
          payload: {
            type: 'error',
            err: overlayErr,
          },
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

const vlsCheckerFactory: ServeCheckerFactory = () => {
  return {
    createDiagnostic: createDiagnostic,
  }
}

export const buildBin: BuildCheckBin = ['vite-plugin-ts-checker-preset-vls', ['diagnostics']]

const { mainScript, workerScript } = createScript({
  absFilename: __filename,
  buildBin,
  checkerFactory: vlsCheckerFactory,
})!

if (isMainThread) {
  const { createWorker, serveAndBuild } = mainScript()
  module.exports.createWorker = createWorker
  module.exports.serveAndBuild = serveAndBuild
} else {
  workerScript()
}

declare const serveAndBuild: any
export { serveAndBuild }
