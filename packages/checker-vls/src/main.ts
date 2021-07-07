import {
  CreateDiagnostic,
  createScript,
  ServeAndBuildChecker,
  SharedConfig,
} from 'vite-plugin-checker'
import { isMainThread, parentPort } from 'worker_threads'

import { DiagnosticOptions, diagnostics } from './commands/diagnostics'

import type { ConfigEnv } from 'vite'

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
      const errorCallback: DiagnosticOptions['errorCallback'] = (diagnostics, overlayErr) => {
        if (!overlay) return
        if (!overlayErr) return

        parentPort?.postMessage({
          type: 'ERROR',
          payload: {
            type: 'error',
            err: overlayErr,
          },
        })
      }

      await diagnostics(workDir, 'WARN', { watch: true, errorCallback, verbose: false })
    },
  }
}

const { mainScript, workerScript } = createScript<{ vls: VlsConfig }>({
  absFilename: __filename,
  buildBin: ['vite-plugin-checker-vls', ['diagnostics']],
  serverChecker: { createDiagnostic },
})!

if (isMainThread) {
  const configCurryFn = (vlsConfig: VlsConfig) => {
    return (sharedConfig: SharedConfig, env: ConfigEnv) => {
      const createChecker = mainScript()
      return createChecker({ vls: vlsConfig, ...sharedConfig }, env)
    }
  }

  module.exports.VlsChecker = configCurryFn
  module.exports.createServeAndBuild = configCurryFn
} else {
  workerScript()
}

type VlsConfig = Partial<{
  // TODO: support VLS config
}>

declare const VlsChecker: (
  options?: VlsConfig
) => (config: VlsConfig & SharedConfig) => ServeAndBuildChecker

export default VlsChecker
export type { VlsConfig }
