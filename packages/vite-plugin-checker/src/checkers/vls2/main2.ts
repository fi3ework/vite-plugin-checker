import { parentPort } from 'worker_threads'

import { Checker, CheckerAbility } from '../../Checker'
import { DiagnosticOptions, diagnostics } from './commands/diagnostics'

import type { CreateDiagnostic } from '../../types'

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

export class VlsChecker extends Checker implements CheckerAbility {
  public constructor() {
    super({
      name: 'vls',
      absFilePath: __filename,
      buildBin: ['vite-plugin-checker-vls', ['diagnostics']],
      createDiagnostic,
    })
  }

  public sealConclusion() {}

  public init() {
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const vlsChecker = new VlsChecker()
vlsChecker.prepare()
vlsChecker.init()
