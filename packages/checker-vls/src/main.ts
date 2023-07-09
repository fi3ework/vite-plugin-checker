import os from 'os'
import { fileURLToPath } from 'url'
import { parentPort } from 'worker_threads'

import { Checker } from 'vite-plugin-checker/Checker'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  toClientPayload,
} from 'vite-plugin-checker/logger'
import { ACTION_TYPES } from 'vite-plugin-checker/types'
import { type DiagnosticOptions, diagnostics } from './diagnostics.js'
import type { VlsConfig } from './types.js'

import type { ConfigEnv } from 'vite'
import type { CreateDiagnostic } from 'vite-plugin-checker/types'

const __filename = fileURLToPath(import.meta.url)

let createServeAndBuild: any

export const createDiagnostic: CreateDiagnostic<VlsConfig> = () => {
  let command: ConfigEnv['command']
  let vlsConfig: VlsConfig | undefined

  return {
    config: async ({ checkerOptions, env }) => {
      command = env.command
    },
    async configureServer({ root }) {
      const workDir: string = root

      const onDispatchDiagnosticsSummary: DiagnosticOptions['onDispatchDiagnosticsSummary'] = (
        errorCount,
        warningCount
      ) => {
        consoleLog(composeCheckerSummary('VLS', errorCount, warningCount))
      }

      const onDispatchDiagnostics: DiagnosticOptions['onDispatchDiagnostics'] = (normalized) => {
        if (command === 'serve') {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toClientPayload('vls', diagnosticToRuntimeError(normalized)),
          })
        }

        consoleLog(normalized.map((d) => diagnosticToTerminalLog(d, 'VLS')).join(os.EOL))
      }

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

export class VlsChecker extends Checker<VlsConfig> {
  public constructor() {
    super({
      absFilePath: __filename,
      build: {
        buildBin: ({ checkerOptions }) => {
          if (typeof checkerOptions === 'object') {
            return [
              'vti',
              [
                'diagnostics',
                // Escape quotes so that the system shell doesn't strip them out:
                '"' + JSON.stringify(checkerOptions).replace(/[\\"]/g, '\\$&') + '"',
              ],
            ]
          }

          return ['vti', ['diagnostics']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    createServeAndBuild = super.createChecker()
  }
}

export const checker = (options?: VlsConfig) => {
  return { createServeAndBuild, options }
}

const vlsChecker = new VlsChecker()
vlsChecker.init()
