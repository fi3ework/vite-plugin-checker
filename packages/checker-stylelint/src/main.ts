import chokidar from 'chokidar'
import stylelint from 'stylelint'
import { translateOptions } from './options.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { parentPort } from 'worker_threads'

import { Checker } from 'vite-plugin-checker/Checker'
import { FileDiagnosticManager } from 'vite-plugin-checker/FileDiagnosticManager'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  filterLogLevel,
  toClientPayload,
} from 'vite-plugin-checker/logger'
import { normalizeStylelintDiagnostic } from './logger.js'
import type { StylelintOptions } from './types.js'
import { ACTION_TYPES, DiagnosticLevel } from 'vite-plugin-checker/types'

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

import type { CreateDiagnostic } from 'vite-plugin-checker/types'

const __filename = fileURLToPath(import.meta.url)

const createDiagnostic: CreateDiagnostic<StylelintOptions> = () => {
  let stylelintOptions: StylelintOptions | undefined

  return {
    config: async ({ checkerOptions }) => {
      stylelintOptions = checkerOptions
    },
    async configureServer({ root }) {
      if (!stylelintOptions) return

      const translatedOptions = await translateOptions(stylelintOptions.lintCommand)
      const baseConfig = {
        cwd: root,
        ...translatedOptions,
      } as const

      const logLevel = (() => {
        if (typeof stylelintOptions !== 'object') return undefined
        const userLogLevel = stylelintOptions.dev?.logLevel
        if (!userLogLevel) return undefined
        const map = {
          error: DiagnosticLevel.Error,
          warning: DiagnosticLevel.Warning,
        } as const

        return userLogLevel.map((l) => map[l])
      })()

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        // if (terminal) {
        diagnostics.forEach((d) => {
          consoleLog(diagnosticToTerminalLog(d, 'Stylelint'))
        })
        const errorCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Error).length
        const warningCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Warning).length
        consoleLog(composeCheckerSummary('Stylelint', errorCount, warningCount))
        // }

        // if (overlay) {
        parentPort?.postMessage({
          type: ACTION_TYPES.overlayError,
          payload: toClientPayload(
            'stylelint',
            diagnostics.map((d) => diagnosticToRuntimeError(d))
          ),
        })
        // }
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
        ...stylelintOptions.dev?.overrideConfig,
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

export class StylelintChecker extends Checker<StylelintOptions> {
  public constructor() {
    super({
      absFilePath: __filename,
      build: {
        buildBin: ({ checkerOptions }) => {
          if (checkerOptions) {
            const { lintCommand } = checkerOptions
            return ['stylelint', lintCommand.split(' ').slice(1)]
          }
          return ['stylelint', ['']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    createServeAndBuild = super.createChecker()
  }
}

export const checker = (options?: StylelintOptions) => {
  return { createServeAndBuild, options }
}

const stylelintChecker = new StylelintChecker()
stylelintChecker.init()
