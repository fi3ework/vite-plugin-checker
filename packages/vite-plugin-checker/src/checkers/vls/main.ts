import chalk from 'chalk'
import os from 'os'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import {
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  toViteCustomPayload,
} from '../../logger'
import { ACTION_TYPES } from '../../types'
import { DiagnosticOptions, diagnostics } from './diagnostics'

import type { ConfigEnv } from 'vite'

import type { CreateDiagnostic } from '../../types'
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

      const onDispatch: DiagnosticOptions['onDispatch'] = (normalized) => {
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

      const onDispatchInitialSummary: DiagnosticOptions['onDispatchInitialSummary'] = (
        errCount
      ) => {
        if (!errCount) {
          consoleLog(chalk.green(`[VLS checker] No error found`))
        } else {
          consoleLog(
            chalk.red(`[VLS checker] Found ${errCount} ${errCount === 1 ? 'error' : 'errors'}`)
          )
        }
      }

      const vlsConfig = pluginConfig?.vls
      await diagnostics(workDir, 'WARN', {
        onDispatch,
        onDispatchInitialSummary,
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
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const vlsChecker = new VlsChecker()
vlsChecker.prepare()
vlsChecker.init()
