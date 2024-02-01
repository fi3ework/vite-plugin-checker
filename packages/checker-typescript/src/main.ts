import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import { parentPort } from 'node:worker_threads'

import { Checker } from 'vite-plugin-checker/Checker'
import {
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  ensureCall,
  toClientPayload,
  wrapCheckerSummary,
} from 'vite-plugin-checker/logger'
import { normalizeTsDiagnostic } from './logger.js'
import {
  ACTION_TYPES,
  type CreateDiagnostic,
  type DiagnosticToRuntime,
} from 'vite-plugin-checker/types'
import type { TscConfig } from './types.js'

const __filename = fileURLToPath(import.meta.url)
let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<TscConfig> = () => {
  let tscConfig: TscConfig | undefined
  let currDiagnostics: DiagnosticToRuntime[] = []

  return {
    config: async ({ checkerOptions }) => {
      tscConfig = checkerOptions
    },
    configureServer(thing) {
      const { root } = thing
      const finalConfig =
        tscConfig === undefined
          ? { root, tsconfigPath: 'tsconfig.json' }
          : {
              root: tscConfig.root ?? root,
              tsconfigPath: tscConfig.tsconfigPath ?? 'tsconfig.json',
            }

      let configFile: string | undefined

      configFile = ts.findConfigFile(finalConfig.root, ts.sys.fileExists, finalConfig.tsconfigPath)

      if (configFile === undefined) {
        throw Error(
          `Failed to find a valid tsconfig.json: ${finalConfig.tsconfigPath} at ${finalConfig.root} is not a valid tsconfig`
        )
      }

      let logChunk = ''

      // https://github.com/microsoft/TypeScript/blob/a545ab1ac2cb24ff3b1aaf0bfbfb62c499742ac2/src/compiler/watch.ts#L12-L28
      const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
        const normalizedDiagnostic = normalizeTsDiagnostic(diagnostic)
        if (normalizedDiagnostic === null) {
          return
        }

        currDiagnostics.push(diagnosticToRuntimeError(normalizedDiagnostic))
        logChunk += os.EOL + diagnosticToTerminalLog(normalizedDiagnostic, 'TypeScript')
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
            // if (overlay) {
            parentPort?.postMessage({
              type: ACTION_TYPES.overlayError,
              payload: toClientPayload('typescript', currDiagnostics),
            })
          // }
        }

        ensureCall(() => {
          if (errorCount === 0) {
            logChunk = ''
          }

          // if (terminal) {
          consoleLog(
            logChunk + os.EOL + wrapCheckerSummary('TypeScript', diagnostic.messageText.toString())
          )
          // }
        })
      }

      // https://github.com/microsoft/TypeScript/issues/32385
      // https://github.com/microsoft/TypeScript/pull/33082/files
      const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram

      if (typeof tscConfig === 'object' && tscConfig?.buildMode) {
        const host = ts.createSolutionBuilderWithWatchHost(
          ts.sys,
          createProgram,
          reportDiagnostic,
          undefined,
          reportWatchStatusChanged
        )

        ts.createSolutionBuilderWithWatch(host, [configFile], {}).build()
      } else {
        const host = ts.createWatchCompilerHost(
          configFile,
          { noEmit: true },
          ts.sys,
          createProgram,
          reportDiagnostic,
          reportWatchStatusChanged
        )

        ts.createWatchProgram(host)
      }
    },
  }
}

class TscChecker extends Checker<TscConfig> {
  public constructor() {
    super({
      absFilePath: __filename,
      build: {
        buildBin: ({ checkerOptions }) => {
          if (typeof checkerOptions === 'object') {
            const { root = '', tsconfigPath = '', buildMode } = checkerOptions

            // Compiler option '--noEmit' may not be used with '--build'
            const args = [buildMode ? '-b' : '--noEmit']

            // Custom config path
            let projectPath = ''
            if (root || tsconfigPath) {
              projectPath = root ? path.join(root, tsconfigPath) : tsconfigPath
            }

            if (projectPath) {
              // In build mode, the tsconfig path is an argument to -b, e.g. "tsc -b [path]"
              if (buildMode) {
                args.push(projectPath)
              } else {
                args.push('-p', projectPath)
              }
            }

            return ['tsc', args]
          }

          return ['tsc', ['--noEmit']]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    createServeAndBuild = super.createChecker()
  }
}

export const checker = (options?: TscConfig) => {
  return { createServeAndBuild, options }
}

const tscChecker = new TscChecker()
tscChecker.init()
