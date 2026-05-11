import type ts from 'typescript'

/**
 * Wrap a `SolutionBuilderWithWatchHost` so every parsed referenced project has
 * `compilerOptions.noEmit` forced to `true`.
 *
 * `createSolutionBuilderWithWatch` takes its emit decisions from each referenced
 * project's own `compilerOptions`. If a referenced tsconfig is truncated or
 * mid-write at the moment TS reads it (which can happen e.g. when a dev tool
 * rewrites tsconfigs at runtime), TS falls back to default options — and the
 * default is `noEmit: false`, so the build host writes `.js` files next to
 * sources. The non-buildMode branch hard-codes `noEmit: true`; this keeps
 * buildMode consistent. See https://github.com/nuxt/nuxt/issues/32872.
 */
export function forceNoEmitOnSolutionBuilderHost<
  H extends {
    getParsedCommandLine?: ts.SolutionBuilderHostBase<ts.BuilderProgram>['getParsedCommandLine']
  },
>(ts: typeof import('typescript'), host: H): H {
  const parseConfigHost: ts.ParseConfigFileHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    onUnRecoverableConfigFileDiagnostic: () => {},
  }

  const original = host.getParsedCommandLine?.bind(host)

  host.getParsedCommandLine = (fileName: string) => {
    const parsed = original
      ? original(fileName)
      : ts.getParsedCommandLineOfConfigFile(
          fileName,
          undefined,
          parseConfigHost,
        )
    if (parsed) {
      parsed.options.noEmit = true
    }
    return parsed
  }

  return host
}
