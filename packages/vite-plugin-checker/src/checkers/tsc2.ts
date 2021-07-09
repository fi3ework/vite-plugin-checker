import os from 'os'
import invariant from 'tiny-invariant'
import ts from 'typescript'
import { isMainThread, parentPort } from 'worker_threads'

import { Checker, CheckerAbility } from '../Checker'
import { diagnosticToTerminalLog, diagnosticToViteError, normalizeDiagnostic } from '../logger'
import { ensureCall } from '../utils'

import type { CreateDiagnostic, PluginConfig, BuildCheckBin } from '../types'
import type { ErrorPayload } from 'vite'

const createDiagnostic: CreateDiagnostic<Pick<PluginConfig, 'typescript'>> = (checkerConfig) => {
  let overlay = true // Vite defaults to true
  let currErr: ErrorPayload['err'] | null = null

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (checkerConfig.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    configureServer({ root }) {
      invariant(checkerConfig.typescript, 'config.typescript should be `false`')
      const finalConfig =
        checkerConfig.typescript === true
          ? { root, tsconfigPath: 'tsconfig.json' }
          : {
              root: checkerConfig.typescript.root ?? root,
              tsconfigPath: checkerConfig.typescript.tsconfigPath ?? 'tsconfig.json',
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
        const formattedDiagnostics = normalizeDiagnostic(diagnostic)
        if (!currErr) {
          currErr = diagnosticToViteError(formattedDiagnostics)
        }

        logChunk += os.EOL + diagnosticToTerminalLog(formattedDiagnostics)
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
            currErr = null
            return
          case 6193: // 1 Error
          case 6194: // 0 errors or 2+ errors
            if (currErr && overlay) {
              parentPort?.postMessage({
                type: 'ERROR',
                payload: {
                  type: 'error',
                  err: currErr,
                },
              })
            }
        }

        ensureCall(() => {
          if (errorCount === 0) {
            logChunk = ''
          }

          console.log(logChunk + (errorCount ? os.EOL : '') + diagnostic.messageText.toString())
        })
      }

      // https://github.com/microsoft/TypeScript/issues/32385
      // https://github.com/microsoft/TypeScript/pull/33082/files
      const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram

      const host = ts.createWatchCompilerHost(
        configFile,
        { noEmit: true },
        ts.sys,
        createProgram,
        reportDiagnostic,
        reportWatchStatusChanged
      )

      ts.createWatchProgram(host)
    },
  }
}

export class TscChecker extends Checker implements CheckerAbility {
  public constructor() {
    super({
      name: 'typescript',
      absFilePath: __filename,
      buildBin: ['tsc', ['--noEmit']],
      createDiagnostic,
    })
  }

  public sealConclusion() {}

  public init() {
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const tscChecker = new TscChecker()
tscChecker.prepare()
tscChecker.init()
