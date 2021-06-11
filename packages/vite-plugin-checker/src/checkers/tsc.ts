import os from 'os'
import invariant from 'tiny-invariant'
import ts from 'typescript'
import { ErrorPayload } from 'vite'
import { isMainThread, parentPort } from 'worker_threads'
import logUpdate from 'log-update'

import { ensureCall, formatHost, tsDiagnosticToViteError } from '../utils'
import { createScript } from '../worker'

import type { CreateDiagnostic, PluginConfig } from '../types'

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
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

      let logChunk: { diagnostics: string | null; message: string | null } = {
        diagnostics: null,
        message: null,
      }

      // https://github.com/microsoft/TypeScript/blob/a545ab1ac2cb24ff3b1aaf0bfbfb62c499742ac2/src/compiler/watch.ts#L12-L28
      const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
        const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(
          [diagnostic],
          formatHost
        )

        if (!currErr) {
          currErr = tsDiagnosticToViteError(diagnostic)
        }

        logChunk.diagnostics = formattedDiagnostics
      }

      const reportWatchStatusChanged: ts.WatchStatusReporter = (
        diagnostic,
        newLine,
        options,
        errorCount
        // eslint-disable-next-line max-params
      ) => {
        // logChunk = []
        // https://github.com/microsoft/TypeScript/issues/32542
        switch (diagnostic.code) {
          case 6032: // Incremental build
            // clear current error and use the newer errors
            currErr = null
            break
          case 6031: // Initial build
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
          const diagnosticMessage = os.EOL + os.EOL + diagnostic.messageText.toString()
          logChunk.message = diagnosticMessage
          if (errorCount === 0) {
            logChunk.diagnostics = null
          }
          const d = logChunk.diagnostics === null ? '' : logChunk.diagnostics + os.EOL
          logUpdate(d + logChunk.message)
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

const { mainScript, workerScript } = createScript<Pick<PluginConfig, 'typescript'>>({
  absFilename: __filename,
  buildBin: ['tsc', ['--noEmit']],
  serverChecker: { createDiagnostic },
})!

if (isMainThread) {
  const createServeAndBuild = mainScript()
  module.exports.createServeAndBuild = createServeAndBuild
} else {
  workerScript()
}
