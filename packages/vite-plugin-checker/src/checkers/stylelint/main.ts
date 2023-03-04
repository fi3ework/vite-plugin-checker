import chokidar from 'chokidar'
import stylelint from 'stylelint'
import { translateOptions } from './options.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker.js'
import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  filterLogLevel,
  normalizeStylelintDiagnostic,
  toClientPayload,
} from '../../logger.js'
import { ACTION_TYPES, DiagnosticLevel } from '../../types.js'

const manager = new FileDiagnosticManager()
let createServeAndBuild

import type { CreateDiagnostic } from '../../types.js'

const __filename = fileURLToPath(import.meta.url)

const createDiagnostic: CreateDiagnostic<'stylelint'> = (pluginConfig) => {
  let overlay = true
  let terminal = true

  return {
    config: async ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    async configureServer({ root }) {
      if (!pluginConfig.stylelint) return

      const translatedOptions = await translateOptions(pluginConfig.stylelint.lintCommand)
      const baseConfig = {
        cwd: root,
        ...translatedOptions,
      } as const

      const logLevel = (() => {
        if (typeof pluginConfig.stylelint !== 'object') return undefined
        const userLogLevel = pluginConfig.stylelint.dev?.logLevel
        if (!userLogLevel) return undefined
        const map = {
          error: DiagnosticLevel.Error,
          warning: DiagnosticLevel.Warning,
        } as const

        return userLogLevel.map((l) => map[l])
      })()

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        if (terminal) {
          diagnostics.forEach((d) => {
            consoleLog(diagnosticToTerminalLog(d, 'Stylelint'))
          })
          const errorCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Error).length
          const warningCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Warning).length
          consoleLog(composeCheckerSummary('Stylelint', errorCount, warningCount))
        }

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toClientPayload(
              'stylelint',
              diagnostics.map((d) => diagnosticToRuntimeError(d))
            ),
          })
        }
      }

      const handleFileChange = async (filePath: string, type: 'change' | 'unlink') => {
        const absPath = path.resolve(root, filePath)

        if (type === 'unlink') {
          manager.updateByFileId(absPath, [])
        } else if (type === 'change') {
          const { results: diagnosticsOfChangedFile } = await stylelint.lint({
            ...baseConfig,
            files: filePath,
          })
          const newDiagnostics = diagnosticsOfChangedFile
            .map((d) => normalizeStylelintDiagnostic(d))
            .flat(1)
          manager.updateByFileId(absPath, newDiagnostics)
        }

        dispatchDiagnostics()
      }

      // initial lint
      const { results: diagnostics } = await stylelint.lint({
        ...baseConfig,
        ...pluginConfig.stylelint.dev?.overrideConfig,
      })

      manager.initWith(diagnostics.map((p) => normalizeStylelintDiagnostic(p)).flat(1))
      dispatchDiagnostics()

      // watch lint
      const watcher = chokidar.watch([], {
        cwd: root,
        ignored: (path: string) => path.includes('node_modules'),
      })
      watcher.add(translatedOptions.files as string)
      watcher.on('change', async (filePath) => {
        handleFileChange(filePath, 'change')
      })
      watcher.on('unlink', async (filePath) => {
        handleFileChange(filePath, 'unlink')
      })
    },
  }
}

export class StylelintChecker extends Checker<'stylelint'> {
  public constructor() {
    super({
      name: 'stylelint',
      absFilePath: __filename,
      build: {
        buildBin: (pluginConfig) => {
          if (pluginConfig.stylelint) {
            const { lintCommand } = pluginConfig.stylelint
            return ['stylelint', lintCommand.split(' ').slice(1)]
          }
          return ['stylelint', ['']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    const _createServeAndBuild = super.initMainThread()
    createServeAndBuild = _createServeAndBuild
    super.initWorkerThread()
  }
}

export { createServeAndBuild }
const stylelintChecker = new StylelintChecker()
stylelintChecker.prepare()
stylelintChecker.init()
