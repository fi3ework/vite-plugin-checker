import { ErrorPayload } from 'vite'
import { createFrame } from './codeFrame'
import ts from 'typescript'
import os from 'os'
import strip from 'strip-ansi'

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

function toViteError(d: ts.Diagnostic): ErrorPayload['err'] {
  const pos = d.start === undefined ? null : d.file?.getLineAndCharacterOfPosition(d.start)
  let loc: ErrorPayload['err']['loc'] = undefined
  if (pos) {
    loc = {
      file: d.file?.fileName,
      line: pos.line + 1,
      column: pos.character + 1,
    }
  }

  // has detail message
  if (d.file && typeof d.start === 'number' && typeof d.length === 'number') {
    return {
      message: strip(
        ts.flattenDiagnosticMessageText(d.messageText, formatHost.getNewLine()) +
          os.EOL +
          os.EOL +
          createFrame({
            source: d.file!.text,
            start: d.file?.getLineAndCharacterOfPosition(d.start),
            end: d.file?.getLineAndCharacterOfPosition(d.start + d.length),
          })
      ),
      stack: '',
      id: d.file?.fileName,
      plugin: 'vite-plugin-fork-ts-checker',
      loc,
    }
  }

  // no detail message
  return {
    message: ts.flattenDiagnosticMessageText(d.messageText, formatHost.getNewLine()),
    stack: '',
    id: d.file?.fileName,
    plugin: 'vite-plugin-fork-ts-checker',
    loc,
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
        console.error(
          'Error',
          diagnostic.code,
          ':',
          ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine())
        )

        if (!currErr) {
          currErr = toViteError(diagnostic)
        }
      }

      const reportWatchStatusChanged: ts.WatchStatusReporter = (
        diagnostic,
        newLine,
        options,
        errorCount
      ) => {
        // https://github.com/microsoft/TypeScript/issues/32542
        switch (diagnostic.code) {
          case 6031: // Initial build
          case 6032: // Incremental build
            // clear current error and use the newer error from compiler
            currErr = null
            break
          case 6193: // 1 Error
          case 6194: // 0 errors or 2+ errors
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
