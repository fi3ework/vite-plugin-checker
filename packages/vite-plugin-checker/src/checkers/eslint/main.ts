import chokidar from 'chokidar'
import { ESLint } from 'eslint'
// @ts-ignore
import optionator from 'eslint/lib/options'
import path from 'path'
import invariant from 'tiny-invariant'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import { FileDiagnosticManager } from '../../FileDiagnosticManager'
import {
  consoleLog,
  diagnosticToTerminalLog,
  diagnosticToRuntimeError,
  filterLogLevel,
  normalizeEslintDiagnostic,
  toViteCustomPayload,
} from '../../logger'
import { ACTION_TYPES, DiagnosticLevel } from '../../types'
import { translateOptions } from './cli'

const manager = new FileDiagnosticManager()

import type { CreateDiagnostic } from '../../types'
const createDiagnostic: CreateDiagnostic<'eslint'> = (pluginConfig) => {
  let overlay = true

  return {
    config: async ({ enableOverlay }) => {
      overlay = enableOverlay
    },
    async configureServer({ root }) {
      if (!pluginConfig.eslint) return

      const options = optionator.parse(pluginConfig.eslint.lintCommand)
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

      const eslint = new ESLint({
        cwd: root,
        ...translatedOptions,
        ...pluginConfig.eslint.dev?.overrideConfig,
      })

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        diagnostics.forEach((d) => {
          consoleLog(diagnosticToTerminalLog(d, 'ESLint'))
        })

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toViteCustomPayload(
              'eslint',
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
      // diagnosticsCache = diagnostics.map((p) => normalizeEslintDiagnostic(p)).flat(1)
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
            // const { _ } = cmdToOptions(lintCommand)

            return ['eslint', lintCommand.split(' ').slice(1)]
          }
          return ['eslint', ['']]
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

const eslintChecker = new EslintChecker()
eslintChecker.prepare()
eslintChecker.init()
