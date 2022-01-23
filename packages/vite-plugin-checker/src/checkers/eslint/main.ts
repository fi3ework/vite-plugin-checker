import chokidar from 'chokidar'
import { ESLint } from 'eslint'
// @ts-ignore
import optionator from 'eslint/lib/options'
import path from 'path'
import invariant from 'tiny-invariant'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import {
  consoleLog,
  diagnosticToTerminalLog,
  diagnosticToViteError,
  NormalizedDiagnostic,
  toViteCustomPayload,
  normalizeEslintDiagnostic,
} from '../../logger'
import { ACTION_TYPES } from '../../types'
import { translateOptions } from './cli'

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

      // const extensions = config.extensions ?? ['.js']
      // const overrideConfigFile = pluginConfig.eslint.configFile
      //   ? { overrideConfigFile: pluginConfig.eslint.configFile }
      //   : {}
      const eslint = new ESLint({
        cwd: root,
        ...translatedOptions,
        ...pluginConfig.eslint.devOptions,
        // extensions,
        // ...overrideConfigFile,
      })

      // invariant(pluginConfig.eslint, 'config.eslint should not be `false`')
      // invariant(
      //   pluginConfig.eslint.files,
      //   `eslint.files is required, but got ${pluginConfig.eslint.files}`
      // )

      // const paths =
      //   typeof pluginConfig.eslint.files === 'string'
      //     ? [pluginConfig.eslint.files]
      //     : pluginConfig.eslint.files
      // const paths = config.

      let diagnosticsCache: NormalizedDiagnostic[] = []

      const dispatchDiagnostics = () => {
        diagnosticsCache.forEach((n) => {
          consoleLog(diagnosticToTerminalLog(n, 'ESLint'))
        })

        const lastErr = diagnosticsCache[0]

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toViteCustomPayload('eslint', lastErr ? [diagnosticToViteError(lastErr)] : []),

            // payload: lastErr
            //   ? {
            //       type: 'error',
            //       err: diagnosticToViteError(lastErr),
            //     }
            //   : null,
          })
        }
      }

      const handleFileChange = async (filePath: string, type: 'change' | 'unlink') => {
        // if (!extensions.includes(path.extname(filePath))) return

        if (type === 'unlink') {
          const absPath = path.resolve(root, filePath)
          diagnosticsCache = diagnosticsCache.filter((d) => d.id !== absPath)
        } else if (type === 'change') {
          console.log(filePath)
          const diagnosticsOfChangedFile = await eslint.lintFiles(filePath)
          const newDiagnostics = diagnosticsOfChangedFile
            .map((d) => normalizeEslintDiagnostic(d))
            .flat(1)
          const absPath = diagnosticsOfChangedFile[0].filePath
          diagnosticsCache = diagnosticsCache.filter((d) => d.id !== absPath).concat(newDiagnostics)
        }

        dispatchDiagnostics()
      }

      // initial lint
      const files = options._.slice(1)
      const diagnostics = await eslint.lintFiles(files)
      diagnosticsCache = diagnostics.map((p) => normalizeEslintDiagnostic(p)).flat(1)
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
