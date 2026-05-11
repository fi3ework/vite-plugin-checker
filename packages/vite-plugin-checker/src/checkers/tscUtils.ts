import type ts from 'typescript'

/**
 * Wrap a `SolutionBuilderWithWatchHost` so that when a referenced project's
 * tsconfig fails to parse, we force `compilerOptions.noEmit` to `true` instead
 * of letting TS fall back to defaults (which include `noEmit: false`).
 *
 * `createSolutionBuilderWithWatch` takes its emit decisions from each referenced
 * project's own `compilerOptions`. If a referenced tsconfig is truncated or
 * mid-write at the moment TS reads it (which can happen e.g. when a dev tool
 * rewrites tsconfigs at runtime), TS falls back to default options — and the
 * default is `noEmit: false`, so the build host writes `.js` files next to
 * sources. See https://github.com/nuxt/nuxt/issues/32872.
 *
 * We deliberately only override when parsing produced errors: forcing
 * `noEmit: true` on every parsed project would break valid `tsc --build`
 * graphs, since composite referenced projects must emit declarations.
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
    if (parsed && parsed.errors.length > 0) {
      parsed.options.noEmit = true
    }
    return parsed
  }

  return host
}
