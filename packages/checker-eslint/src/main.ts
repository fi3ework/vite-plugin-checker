import Module from 'node:module'
import chokidar from 'chokidar'
import { ESLint } from 'eslint'
import path from 'node:path'
import invariant from 'tiny-invariant'
import { fileURLToPath } from 'node:url'
import { parentPort } from 'node:worker_threads'

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
import { ACTION_TYPES, DiagnosticLevel } from 'vite-plugin-checker/types'
import { translateOptions } from './cli.js'
import { normalizeEslintDiagnostic } from './logger.js'
import type { EslintOptions } from './types.js'
import { options as optionator } from './options.js'

const require = Module.createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

import type { CreateDiagnostic } from 'vite-plugin-checker/types'

// @ts-ignore
const createDiagnostic: CreateDiagnostic<EslintOptions> = () => {
  let eslintOptions: EslintOptions | undefined

  return {
    config: async ({ checkerOptions }) => {
      eslintOptions = checkerOptions
    },
    async configureServer({ root }) {
      if (!eslintOptions) return

      const options = optionator.parse(eslintOptions.lintCommand)
      invariant(
        !options.fix,
        'Using `--fix` in `config.eslint.lintCommand` is not allowed in vite-plugin-checker, you could using `--fix` with editor.'
      )

      const translatedOptions = translateOptions(options) as ESLint.Options

      const logLevel = (() => {
        if (typeof eslintOptions !== 'object') return undefined
        const userLogLevel = eslintOptions.dev?.logLevel
        if (!userLogLevel) return undefined
        const map = {
          error: DiagnosticLevel.Error,
          warning: DiagnosticLevel.Warning,
        } as const

        return userLogLevel.map((l) => map[l])
      })()

      const finalEslintOptions: ESLint.Options = {
        cwd: root,
        ...translatedOptions,
        ...eslintOptions.dev?.overrideConfig,
      }

      let eslint: ESLint
      if (eslintOptions.useFlatConfig) {
        const { FlatESLint, shouldUseFlatConfig } = require('eslint/use-at-your-own-risk')
        if (shouldUseFlatConfig?.()) {
          eslint = new FlatESLint({
            cwd: root,
          })
        } else {
          throw Error('Please upgrade your eslint to latest version to use `useFlatConfig` option.')
        }
      } else {
        eslint = new ESLint(finalEslintOptions)
      }

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        diagnostics.forEach((d) => {
          consoleLog(diagnosticToTerminalLog(d, 'ESLint'))
        })
        const errorCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Error).length
        const warningCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Warning).length
        consoleLog(composeCheckerSummary('ESLint', errorCount, warningCount))

        parentPort?.postMessage({
          type: ACTION_TYPES.overlayError,
          payload: toClientPayload(
            'eslint',
            diagnostics.map((d) => diagnosticToRuntimeError(d))
          ),
        })
      }

      const handleFileChange = async (filePath: string, type: 'change' | 'unlink') => {
        // See: https://github.com/eslint/eslint/pull/4465
        const extension = path.extname(filePath)
        const { extensions } = finalEslintOptions
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

export class EslintChecker extends Checker<EslintOptions> {
  public constructor() {
    super({
      absFilePath: __filename,
      build: {
        buildBin: ({ checkerOptions }) => {
          if (checkerOptions) {
            const { lintCommand } = checkerOptions
            return ['eslint', lintCommand.split(' ').slice(1)]
          }
          return ['eslint', ['']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    createServeAndBuild = super.createChecker()
  }
}

export const checker = (options?: EslintOptions) => {
  return { createServeAndBuild, options }
}

const eslintChecker = new EslintChecker()
eslintChecker.init()
