import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import { ACTION_TYPES } from '../../types'
import { DiagnosticOptions, diagnostics } from './diagnostics'

import type { CreateDiagnostic } from '../../types'
export const createDiagnostic: CreateDiagnostic<'vls'> = (pluginConfig) => {
  let overlay = true // Vite defaults to true

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (pluginConfig.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer({ root }) {
      const workDir: string = root
      const errorCallback: DiagnosticOptions['errorCallback'] = (diagnostics, overlayErr) => {
        if (!overlay) return
        parentPort?.postMessage({
          type: ACTION_TYPES.overlayError,
          payload: overlayErr
            ? {
                type: 'error',
                err: overlayErr,
              }
            : null,
        })
      }
      await diagnostics(workDir, 'WARN', { watch: true, errorCallback, verbose: false })
    },
  }
}

export class VlsChecker extends Checker<'vls'> {
  public constructor() {
    super({
      name: 'vls',
      absFilePath: __filename,
      build: { buildBin: ['vite-plugin-checker-vls', ['diagnostics']] },
      createDiagnostic,
    })
  }

  public init() {
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const vlsChecker = new VlsChecker()
vlsChecker.prepare()
vlsChecker.init()
