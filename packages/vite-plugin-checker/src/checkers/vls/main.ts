import os from 'os'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  toViteCustomPayload,
} from '../../logger.js'
import { ACTION_TYPES } from '../../types.js'
import { DiagnosticOptions, diagnostics } from './diagnostics.js'

import type { ConfigEnv } from 'vite'

import type { CreateDiagnostic } from '../../types.js'

let createServeAndBuild

export const createDiagnostic: CreateDiagnostic<'vls'> = (pluginConfig) => {
  let overlay = true
  let terminal = true
  let command: ConfigEnv['command']

  return {
    config: ({ enableOverlay, enableTerminal, env }) => {
      overlay = enableOverlay
      terminal = enableTerminal
      command = env.command
    },
    async configureServer({ root }) {
      const workDir: string = root

      const onDispatchDiagnosticsSummary: DiagnosticOptions['onDispatchDiagnosticsSummary'] = (
        errorCount,
        warningCount
      ) => {
        if (!terminal) return

        consoleLog(composeCheckerSummary('VLS', errorCount, warningCount))
      }

      const onDispatchDiagnostics: DiagnosticOptions['onDispatchDiagnostics'] = (normalized) => {
        if (overlay && command === 'serve') {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toViteCustomPayload('vls', diagnosticToRuntimeError(normalized)),
          })
        }

        if (terminal) {
          consoleLog(normalized.map((d) => diagnosticToTerminalLog(d, 'VLS')).join(os.EOL))
        }
      }

      const vlsConfig = pluginConfig?.vls
      await diagnostics(workDir, 'WARN', {
        onDispatchDiagnostics,
        onDispatchDiagnosticsSummary,
        watch: true,
        verbose: false,
        config: typeof vlsConfig === 'object' ? vlsConfig : null,
      })
    },
  }
}

export class VlsChecker extends Checker<'vls'> {
  public constructor() {
    super({
      name: 'vls',
      absFilePath: __filename,
      build: {
        buildBin: (config) => {
          if (typeof config.vls === 'object') {
            return [
              'vite-plugin-checker-vls',
              [
                'diagnostics',
                '--checker-config',
                // Escape quotes so that the system shell doesn't strip them out:
                '"' + JSON.stringify(config.vls).replace(/[\\"]/g, '\\$&') + '"',
              ],
            ]
          }

          return ['vite-plugin-checker-vls', ['diagnostics']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    const _createServeAndBuild = super.initMainThread()
    // module.exports.createServeAndBuild = createServeAndBuild
    createServeAndBuild = _createServeAndBuild
    super.initWorkerThread()
  }
}

export { createServeAndBuild }
const vlsChecker = new VlsChecker()
vlsChecker.prepare()
vlsChecker.init()
