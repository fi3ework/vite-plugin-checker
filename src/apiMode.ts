import { ErrorPayload } from 'vite'
import ts from 'typescript'

import type { UserConfig, ViteDevServer } from 'vite'
interface DiagnoseOptions {
  root: string
  tsconfigPath: string
}

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

function toViteError(diagnostic: ts.Diagnostic): ErrorPayload['err'] {
  return {
    message: 'string',
    stack: 'a/b/c/d',
    id: 'string',
    frame: 'string',
    plugin: 'string',
    pluginCode: 'string',
    // loc?: {
    // file?: string
    // line: number
    // column: number
    // }
  }
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */

export function createDiagnosis(userOptions: Partial<DiagnoseOptions> = {}) {
  let overlay = true // Vite default to true
  let currErr: ErrorPayload['err'] | null = null

  return {
    config: (config: UserConfig) => {
      const hmr = config.server?.hmr
      if (typeof hmr === 'object' && hmr.overlay === false) {
        overlay = true
      }
    },
    configureServer(server: ViteDevServer) {
      const finalConfig: DiagnoseOptions = {
        root: process.cwd(),
        tsconfigPath: 'tsconfig.json',
        ...userOptions,
      }

      const configFile = ts.findConfigFile(
        finalConfig.root,
        ts.sys.fileExists,
        finalConfig.tsconfigPath
      )

      if (!configFile) {
        throw new Error("Could not find a valid 'tsconfig.json'.")
      }

      const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
        const { file } = diagnostic
        console.error(
          'Error',
          diagnostic.code,
          ':',
          ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine())
        )
        return toViteError(diagnostic)
      }

      const reportWatchStatusChanged: ts.WatchStatusReporter = (
        diagnostic,
        newLine,
        options,
        errorCount
      ) => {
        // https://github.com/microsoft/TypeScript/issues/32542
        console.log(diagnostic)
        switch (diagnostic.code) {
          case 6031: // Initial build
          case 6032: // Incremental build
            // clear current error and use the newer error from compiler
            currErr = null
            break
          case 6193: // 1 Error
            currErr = toViteError(diagnostic)
          case 6194: // 0 errors or 2+ errors
            if (errorCount === 0 || errorCount === undefined) {
            } else {
              if (!currErr) currErr = toViteError(diagnostic)
            }

            if (currErr) {
              server.ws.send({
                type: 'error',
                err: currErr,
              })
            }
        }
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

      // You can technically override any given hook on the host, though you probably
      // don't need to.
      // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
      // doesn't use `this` at all.
      // const origCreateProgram = host.createProgram
      // @ts-ignore
      // host.createProgram = (rootNames: ReadonlyArray<string>, options, host, oldProgram) => {
      //   console.log("** We're about to create the program! **")
      //   return origCreateProgram(rootNames, options, host, oldProgram)
      // }

      // const origPostProgramCreate = host.afterProgramCreate

      // host.afterProgramCreate = (program) => {
      //   console.log('** We finished making the program! **')
      //   origPostProgramCreate!(program)
      // }

      // `createWatchProgram` creates an initial program, watches files, and updates
      // the program over time.
      ts.createWatchProgram(host)
    },
  }
}

export const diagnose = createDiagnosis()
