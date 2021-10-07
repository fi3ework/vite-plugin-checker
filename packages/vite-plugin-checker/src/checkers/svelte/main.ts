import os from 'os'
import path from 'path'
import * as fs from 'fs'
import invariant from 'tiny-invariant'
import { URI } from 'vscode-uri'
import { watch } from 'chokidar'
import { SvelteCheck } from 'svelte-language-server'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import {
  diagnosticToTerminalLog,
  diagnosticToViteError,
  normalizeLspDiagnostic,
} from '../../logger'

import type { CreateDiagnostic } from '../../types'

// based off the class in svelte-check/src/index.ts
class DiagnosticsWatcher {
  private updateDiagnostics: any
  private svelteCheck: SvelteCheck
  private overlay: boolean

  public constructor(root: string, overlay: boolean) {
    this.overlay = overlay
    this.svelteCheck = new SvelteCheck(root, {
      compilerWarnings: {},
      diagnosticSources: ['js', 'svelte', 'css'],
    })

    watch(`${root}/**/*.{svelte,d.ts,ts,js}`, {
      ignored: ['node_modules'].map((ignore) => path.join(root, ignore)),
      ignoreInitial: false,
    })
      .on('add', (path) => this.updateDocument(path, true))
      .on('unlink', (path) => this.removeDocument(path))
      .on('change', (path) => this.updateDocument(path, false))
  }

  private async updateDocument(path: string, isNew: boolean) {
    const text = fs.readFileSync(path, 'utf-8')
    await this.svelteCheck.upsertDocument({ text, uri: URI.file(path).toString() }, isNew)
    this.scheduleDiagnostics()
  }

  private async removeDocument(path: string) {
    await this.svelteCheck.removeDocument(URI.file(path).toString())
    this.scheduleDiagnostics()
  }

  private scheduleDiagnostics() {
    clearTimeout(this.updateDiagnostics)
    this.updateDiagnostics = setTimeout(async () => {
      let logChunk = ''
      try {
        const ds = await this.svelteCheck.getDiagnostics()
        let currErr = null

        for (const { filePath, text, diagnostics } of ds) {
          for (const diagnostic of diagnostics) {
            const formattedDiagnostic = normalizeLspDiagnostic({
              diagnostic,
              absFilePath: filePath,
              fileText: text,
              checker: 'svelte',
            })

            if (currErr === null) {
              currErr = diagnosticToViteError(formattedDiagnostic)
            }
            logChunk += os.EOL + diagnosticToTerminalLog(formattedDiagnostic, 'svelte')
          }
        }

        if (this.overlay) {
          parentPort?.postMessage({
            type: 'ERROR',
            payload: {
              type: 'error',
              err: currErr,
            },
          })
        }

        console.log(logChunk)
      } catch (err) {
        if (this.overlay) {
          parentPort?.postMessage({
            type: 'ERROR',
            payload: {
              type: 'error',
              err: err.message,
            },
          })
        }
        console.error(err.message)
      }
    }, 1000)
  }
}

const createDiagnostic: CreateDiagnostic<'svelte'> = (pluginConfig) => {
  let overlay = true // Vite defaults to true

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (pluginConfig.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    configureServer({ root }) {
      invariant(pluginConfig.svelte, 'config.svelte should be `false`')
      let svelteRoot = root

      if (pluginConfig.svelte !== true && pluginConfig.svelte.root) {
        svelteRoot = pluginConfig.svelte.root
      }

      let watcher = new DiagnosticsWatcher(svelteRoot, overlay)
      return watcher
    },
  }
}

export class SvelteChecker extends Checker<'svelte'> {
  public constructor() {
    super({
      name: 'svelte',
      absFilePath: __filename,
      build: {
        buildBin: (_config) => {
          return ['svelte-check', []]
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

const svelteChecker = new SvelteChecker()
svelteChecker.prepare()
svelteChecker.init()
