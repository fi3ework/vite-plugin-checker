import os from 'os'
import path from 'path'
import invariant from 'tiny-invariant'
import ts from 'typescript'
import { parentPort } from 'worker_threads'

import { Checker } from '../../Checker'
import {
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  ensureCall,
  normalizeVueTscDiagnostic,
  toViteCustomPayload,
  wrapCheckerSummary,
} from '../../logger'
import { ACTION_TYPES, CreateDiagnostic, DiagnosticLevel, DiagnosticToRuntime } from '../../types'
import { prepareVueTsc } from './prepareVueTsc'

const createDiagnostic: CreateDiagnostic<'vueTsc'> = (pluginConfig) => {
  let overlay = true
  let terminal = true
  let currDiagnostics: DiagnosticToRuntime[] = []

  return {
    config: ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    configureServer({ root }) {
      invariant(pluginConfig.vueTsc, 'config.vueTsc should be `false`')

      const { targetTsDir } = prepareVueTsc()

      const vueTs = require(path.resolve(targetTsDir, 'lib/tsc.js'))

      const finalConfig =
        pluginConfig.vueTsc === true
          ? { root, tsconfigPath: 'tsconfig.json' }
          : {
              root: pluginConfig.vueTsc.root ?? root,
              tsconfigPath: pluginConfig.vueTsc.tsconfigPath ?? 'tsconfig.json',
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
            if (overlay) {
              parentPort?.postMessage({
                type: ACTION_TYPES.overlayError,
                payload: toViteCustomPayload('vue-tsc', currDiagnostics),
              })
            }
        }

        ensureCall(() => {
          if (errorCount === 0) {
            logChunk = ''
          }

          if (terminal) {
            consoleLog(
              logChunk + os.EOL + wrapCheckerSummary('vue-tsc', diagnostic.messageText.toString())
            )
          }
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

export class VueTscChecker extends Checker<'vueTsc'> {
  public constructor() {
    super({
      name: 'vueTsc',
      absFilePath: __filename,
      build: {
        buildBin: (config) => {
          if (typeof config.vueTsc === 'object') {
            const { root, tsconfigPath } = config.vueTsc

            let args = ['--noEmit']
            // Custom config path
            if (tsconfigPath) {
              const fullConfigPath = root ? path.join(root, tsconfigPath) : tsconfigPath
              args = args.concat(['-p', fullConfigPath])
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
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const tscChecker = new VueTscChecker()
tscChecker.prepare()
tscChecker.init()
