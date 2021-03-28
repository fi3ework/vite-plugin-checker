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

function reportDiagnostic(diagnostic: ts.Diagnostic) {
  console.error(
    'Error',
    diagnostic.code,
    ':',
    ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine())
  )
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
  console.info(ts.formatDiagnostic(diagnostic, formatHost))
}

export function createDiagnosis(userOptions: Partial<DiagnoseOptions> = {}) {
  let overlay = true // Vite default to true
  let err: string | null = null

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

      // const { config } = ts.readConfigFile(configFile, ts.sys.readFile)
      // const { options } = ts.parseJsonConfigFileContent(config, ts.sys, finalConfig.root)
      // force --noEmit
      // options.noEmit = true

      // https://github.com/microsoft/TypeScript/issues/32385
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
