import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import type ts from 'typescript'
import { fileURLToPath } from 'url'
import { parentPort } from 'worker_threads'

import { Checker } from 'vite-plugin-checker/Checker'
import { normalizeVueTscDiagnostic } from './logger.js'
import {
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  ensureCall,
  toClientPayload,
  wrapCheckerSummary,
} from 'vite-plugin-checker/logger'
import {
  ACTION_TYPES,
  type CreateDiagnostic,
  type DiagnosticToRuntime,
} from 'vite-plugin-checker/types'
import { prepareVueTsc } from './prepareVueTsc.js'
import type { VueTscConfig } from './types.js'

const _require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)

let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<VueTscConfig> = () => {
  let currDiagnostics: DiagnosticToRuntime[] = []
  let vueTscOptions: VueTscConfig | undefined

  return {
    config: ({ checkerOptions }) => {
      vueTscOptions = checkerOptions
    },
    async configureServer({ root }) {
      const { targetTsDir } = await prepareVueTsc()
      const vueTs = _require(path.resolve(targetTsDir, 'lib/typescript.js'))
      const finalConfig =
        vueTscOptions === undefined
          ? { root, tsconfigPath: 'tsconfig.json' }
          : {
              root: vueTscOptions.root ?? root,
              tsconfigPath: vueTscOptions.tsconfigPath ?? 'tsconfig.json',
            }

      let configFile: string | undefined

      configFile = vueTs.findConfigFile(
        finalConfig.root,
        vueTs.sys.fileExists,
        finalConfig.tsconfigPath
      )

      if (configFile === undefined) {
        throw Error(
          `Failed to find a valid tsconfig.json: ${finalConfig.tsconfigPath} at ${finalConfig.root} is not a valid tsconfig`
        )
      }

      let logChunk = ''
      let prevLogChunk = ''

      // https://github.com/microsoft/TypeScript/blob/a545ab1ac2cb24ff3b1aaf0bfbfb62c499742ac2/src/compiler/watch.ts#L12-L28
      const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
        const normalizedDiagnostic = normalizeVueTscDiagnostic(diagnostic)
        if (normalizedDiagnostic === null) {
          return
        }

        currDiagnostics.push(diagnosticToRuntimeError(normalizedDiagnostic))
        logChunk += os.EOL + diagnosticToTerminalLog(normalizedDiagnostic, 'vue-tsc')
      }

      const reportWatchStatusChanged: ts.WatchStatusReporter = (
        diagnostic,
        newLine,
        options,
        errorCount
        // eslint-disable-next-line max-params
      ) => {
        if (diagnostic.code === 6031) return
        // https://github.com/microsoft/TypeScript/issues/32542
        // https://github.com/microsoft/TypeScript/blob/dc237b317ed4bbccd043ddda802ffde00362a387/src/compiler/diagnosticMessages.json#L4086-L4088
        switch (diagnostic.code) {
          case 6031:
          case 6032:
            // clear current error and use the newer errors
            logChunk = ''
            // currErr = null
            currDiagnostics = []
            return
          case 6193: // 1 Error
          case 6194: // 0 errors or 2+ errors
            parentPort?.postMessage({
              type: ACTION_TYPES.overlayError,
              payload: toClientPayload('vue-tsc', currDiagnostics),
            })
        }

        ensureCall(() => {
          if (errorCount === 0) {
            logChunk = ''
          }

          logChunk =
            logChunk + os.EOL + wrapCheckerSummary('vue-tsc', diagnostic.messageText.toString())
          if (logChunk === prevLogChunk) {
            return
          }

          // TODO: only macOS will report multiple times for same result
          prevLogChunk = logChunk
          consoleLog(logChunk)
        })
      }

      // https://github.com/microsoft/TypeScript/issues/32385
      // https://github.com/microsoft/TypeScript/pull/33082/files
      const createProgram = vueTs.createSemanticDiagnosticsBuilderProgram

      const host = vueTs.createWatchCompilerHost(
        configFile,
        { noEmit: true },
        vueTs.sys,
        createProgram,
        reportDiagnostic,
        reportWatchStatusChanged
      )

      vueTs.createWatchProgram(host)
    },
  }
}

export class VueTscChecker extends Checker<VueTscConfig> {
  public constructor() {
    super({
      absFilePath: __filename,
      build: {
        buildBin: ({ checkerOptions }) => {
          if (typeof checkerOptions === 'object') {
            const { root = '', tsconfigPath = '' } = checkerOptions

            let args = ['--noEmit']
            // Custom config path
            let projectPath = ''
            if (root || tsconfigPath) {
              projectPath = root ? path.join(root, tsconfigPath) : tsconfigPath
            }

            if (projectPath) {
              args.push('-p', projectPath)
            }

            return ['vue-tsc', args]
          }

          return ['vue-tsc', ['--noEmit']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    createServeAndBuild = super.createChecker()
  }
}

export const checker = (options?: VueTscConfig) => {
  return { createServeAndBuild, options }
}

const tscChecker = new VueTscChecker()
tscChecker.init()
