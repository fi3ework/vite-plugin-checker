import Module from 'node:module'
import chokidar from 'chokidar'
import { ESLint } from 'eslint'
import path from 'path'
import invariant from 'tiny-invariant'
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
  normalizeEslintDiagnostic,
  toClientPayload,
} from '../../logger.js'
import { ACTION_TYPES, DiagnosticLevel } from '../../types.js'
import { translateOptions } from './cli.js'
import { options as optionator } from './options.js'

const __filename = fileURLToPath(import.meta.url)
const require = Module.createRequire(import.meta.url)

const manager = new FileDiagnosticManager()
let createServeAndBuild

import type { CreateDiagnostic } from '../../types'
const createDiagnostic: CreateDiagnostic<'eslint'> = (pluginConfig) => {
  let overlay = true
  let terminal = true

  return {
    config: async ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    async configureServer({ root }) {
      if (!pluginConfig.eslint) return

      const options = optionator.parse(pluginConfig.eslint.lintCommand)
      invariant(
        !options.fix,
        'Using `--fix` in `config.eslint.lintCommand` is not allowed in vite-plugin-checker, you could using `--fix` with editor.'
      )

      const translatedOptions = translateOptions(options) as ESLint.Options

      const logLevel = (() => {
        if (typeof pluginConfig.eslint !== 'object') return undefined
        const userLogLevel = pluginConfig.eslint.dev?.logLevel
        if (!userLogLevel) return undefined
        const map = {
          error: DiagnosticLevel.Error,
          warning: DiagnosticLevel.Warning,
        } as const

        return userLogLevel.map((l) => map[l])
      })()

      const eslintOptions: ESLint.Options = {
        cwd: root,
        ...translatedOptions,
        ...pluginConfig.eslint.dev?.overrideConfig,
      }

      let eslint: ESLint
      if (pluginConfig.eslint.useFlatConfig) {
        const { FlatESLint, shouldUseFlatConfig } = require('eslint/use-at-your-own-risk')
        if (shouldUseFlatConfig?.()) {
          eslint = new FlatESLint({
            cwd: root,
          })
        } else {
          throw Error('Please upgrade your eslint to latest version to use `useFlatConfig` option.')
        }
      } else {
        eslint = new ESLint(eslintOptions)
      }

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        if (terminal) {
          diagnostics.forEach((d) => {
            consoleLog(diagnosticToTerminalLog(d, 'ESLint'))
          })
          const errorCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Error).length
          const warningCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Warning).length
          consoleLog(composeCheckerSummary('ESLint', errorCount, warningCount))
        }

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toClientPayload(
              'eslint',
              diagnostics.map((d) => diagnosticToRuntimeError(d))
            ),
          })
        }
      }

      const handleFileChange = async (filePath: string, type: 'change' | 'unlink') => {
        // See: https://github.com/eslint/eslint/pull/4465
        const extension = path.extname(filePath)
        const { extensions } = eslintOptions
        const hasExtensionsConfig = Array.isArray(extensions)
        if (hasExtensionsConfig && !extensions.includes(extension)) return

        const isChangedFileIgnored = await eslint.isPathIgnored(filePath)
        if (isChangedFileIgnored) return

        const absPath = path.resolve(root, filePath)
        if (type === 'unlink') {
          manager.updateByFileId(absPath, [])
        } else if (type === 'change') {
          const diagnosticsOfChangedFile = await eslint.lintFiles(filePath)
          const newDiagnostics = diagnosticsOfChangedFile
            .map((d) => normalizeEslintDiagnostic(d))
            .flat(1)
          manager.updateByFileId(absPath, newDiagnostics)
        }

        dispatchDiagnostics()
      }

      // initial lint
      const files = options._.slice(1)
      const diagnostics = await eslint.lintFiles(files)

      manager.initWith(diagnostics.map((p) => normalizeEslintDiagnostic(p)).flat(1))
      dispatchDiagnostics()

      // watch lint
      const watcher = chokidar.watch([], {
        cwd: root,
        ignored: (path: string) => path.includes('node_modules'),
      })
      watcher.add(files)
      watcher.on('change', async (filePath) => {
        handleFileChange(filePath, 'change')
      })
      watcher.on('unlink', async (filePath) => {
        handleFileChange(filePath, 'unlink')
      })
    },
  }
}

export class EslintChecker extends Checker<'eslint'> {
  public constructor() {
    super({
      name: 'eslint',
      absFilePath: __filename,
      build: {
        buildBin: (pluginConfig) => {
          if (pluginConfig.eslint) {
            const { lintCommand } = pluginConfig.eslint
            return ['eslint', lintCommand.split(' ').slice(1)]
          }
          return ['eslint', ['']]
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
const eslintChecker = new EslintChecker()
eslintChecker.prepare()
eslintChecker.init()
