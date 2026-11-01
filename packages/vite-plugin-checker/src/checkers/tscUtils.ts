import fs from 'node:fs'
import path from 'node:path'
import type ts from 'typescript'

import type { TscConfig } from '../types.js'

function findConfigFile(searchPath: string, configName: string) {
  let dir = path.resolve(searchPath)
  while (true) {
    const candidate = path.resolve(dir, configName)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) return
    dir = parent
  }
}

function readJsonc(file: string): unknown {
  const text = fs
    .readFileSync(file, 'utf-8')
    .replace(
      /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      (_, str) => str ?? '',
    )
    .replace(/("(?:\\.|[^"\\])*")|,(\s*[}\]])/g, (_, str, end) => str ?? end)
  return JSON.parse(text)
}

function isSolutionTsconfig(configFile: string): boolean {
  try {
    const config = readJsonc(configFile) as {
      files?: unknown
      references?: unknown
    }
    return (
      Array.isArray(config.files) &&
      config.files.length === 0 &&
      !('include' in config) &&
      Array.isArray(config.references) &&
      config.references.length > 0
    )
  } catch {
    return false
  }
}

export function resolveBuildMode(
  buildMode: boolean | undefined,
  configFile: string | undefined,
): boolean {
  return buildMode ?? (!!configFile && isSolutionTsconfig(configFile))
}

export function getTscBuildArgs(
  options: Exclude<TscConfig, boolean>,
  cwd: string,
): string[] {
  const root = options.root || cwd
  const tsconfigPath = options.tsconfigPath || 'tsconfig.json'
  const foundConfigFile = findConfigFile(root, tsconfigPath)
  const buildMode = resolveBuildMode(options.buildMode, foundConfigFile)

  const args = [buildMode ? '-b' : '--noEmit']
  if (!options.root && !options.tsconfigPath) return args

  const configFile = foundConfigFile ?? path.resolve(root, tsconfigPath)
  const projectPath = path.relative(cwd, configFile)

  // `tsc -b` takes the project as a positional argument and rejects `-p`.
  return buildMode ? [...args, projectPath] : [...args, '-p', projectPath]
}

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
          // `tscBuild` is the internal flag the solution builder sets on every
          // referenced project's parsed options. Without it `canEmitTsBuildInfo`
          // returns false, so a `noEmit: true` referenced project whose
          // `include` resolves to only `.d.ts` files has no output path at all
          // and `getFirstProjectOutput` crashes.
          { tscBuild: true } as ts.CompilerOptions,
          parseConfigHost,
        )
    if (parsed && parsed.errors.length > 0) {
      parsed.options.noEmit = true
    }
    return parsed
  }

  return host
}
