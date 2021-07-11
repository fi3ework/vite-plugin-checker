import { ESLint } from 'eslint'
// import debounce from 'lodash.debounce'
import os from 'os'
import path from 'path'
import invariant from 'tiny-invariant'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import {
  diagnosticToTerminalLog,
  diagnosticToViteError,
  NormalizedDiagnostic,
  normalizeEslintDiagnostic,
} from '../../logger'

import type { CreateDiagnostic } from '../../types'
import type { ErrorPayload } from 'vite'

function findOneErrorFromCache() {}

const createDiagnostic: CreateDiagnostic<'eslint'> = (pluginConfig) => {
  let overlay = true // Vite defaults to true
  let currErr: ErrorPayload['err'] | null = null

  return {
    config: async ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)
      if (pluginConfig.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer({ root }) {
      if (!pluginConfig.eslint) return

      const extensions = pluginConfig.eslint.ext ? pluginConfig.eslint?.ext.split(',') : undefined
      const namedExtensions = extensions ?? ['.js']
      const eslint = new ESLint({
        extensions,
      })
      invariant(pluginConfig.eslint, 'config.eslint should not be `false`')
      invariant(
        pluginConfig.eslint.files,
        `eslint.files is required, but got ${pluginConfig.eslint.files}`
      )

      const paths =
        typeof pluginConfig.eslint.files === 'string'
          ? [pluginConfig.eslint.files]
          : pluginConfig.eslint.files

      const diagnosticsCache: Record<string, NormalizedDiagnostic[]> = {}

      Checker.watcher.add(paths)
      Checker.watcher.on('all', async (event, filePath) => {
        if (!['add', 'change'].includes(event)) return
        if (!namedExtensions.includes(path.extname(filePath))) return

        const diagnostics = await eslint.lintFiles(filePath)
        const normalized = diagnostics.map((p) => normalizeEslintDiagnostic(p)).flat(1)
        normalized.forEach((n) => {
          console.log(diagnosticToTerminalLog(n))
        })
        diagnosticsCache[filePath] = normalized

        const lastErr = normalized[0]

        if (!lastErr) return

        if (overlay) {
          parentPort?.postMessage({
            type: 'ERROR',
            payload: {
              type: 'error',
              err: diagnosticToViteError(lastErr),
            },
          })
        }
      })
    },
  }
}

export class EslintChecker extends Checker<'eslint'> {
  public constructor() {
    super({
      name: 'typescript',
      absFilePath: __filename,
      build: {
        buildBin: (pluginConfig) => {
          let ext = '.js'
          let files: string[] = []
          if (pluginConfig.eslint) {
            ext = pluginConfig.eslint.ext ?? ext
            files =
              typeof pluginConfig.eslint.files === 'string'
                ? [pluginConfig.eslint.files]
                : pluginConfig.eslint.files
          }

          return ['eslint', ['--ext', ext, ...files]]
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
