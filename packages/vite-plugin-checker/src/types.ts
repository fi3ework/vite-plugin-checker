import type { Worker } from 'node:worker_threads'
import type { ESLint } from 'eslint'
import type * as Stylelint from 'stylelint'
import type { ConfigEnv, ErrorPayload } from 'vite'
import type { CheckerStatus, Snippet } from './protocol.js'

/* ----------------------------- userland plugin options ----------------------------- */

interface TsConfigOptions {
  /**
   * Path to the tsconfig file, relative to `root`.
   * @default 'tsconfig.json'
   */
  tsconfigPath: string
  /**
   * Module specifier or absolute path of the `typescript` package used in dev
   * mode. Only supported by the `typescript` checker.
   * @default 'typescript'
   */
  typescriptPath: string
  /**
   * Directory to resolve `tsconfigPath` from. Defaults to the Vite root.
   */
  root: string
  /**
   * Run in build mode (`--build`). Defaults to `true` when the tsconfig is
   * solution-style (`"files": []` with `references`), otherwise `false`.
   */
  buildMode: boolean
}

/**
 * TypeScript checker configuration
 * @default true
 */
export type TscConfig =
  /**
   * - set to `true` to enable type checking with default configuration
   * - set to `false` to disable type checking, you can also remove `config.typescript` directly
   */
  boolean | Partial<TsConfigOptions>

/** vue-tsc checker configuration */
export type VueTscConfig =
  /**
   * - set to `true` to enable type checking with default configuration
   * - set to `false` to disable type checking, you can also remove `config.vueTsc` directly
   */
  boolean | Partial<TsConfigOptions>

/** ESLint checker configuration */
export type EslintConfig =
  | false
  | {
      /**
       * Paths to watch in dev mode, relative to the root. Defaults to the root.
       */
      watchPath?: string | string[]
      /**
       * ESLint CLI command, such as `eslint "./src/**\/*.ts"`. Runs as-is in
       * build mode; in dev mode its options and file patterns are passed to
       * the ESLint Node.js API.
       */
      lintCommand: string
      /**
       * Use flat config mode. Only relevant for ESLint v9 which supports both
       * flat config and legacy eslintrc modes. ESLint v10+ always uses flat config.
       *
       * - `true`: Use flat config (default for ESLint v9 and v10+)
       * - `false`: Use legacy eslintrc config (ESLint v9 only)
       *
       * When not specified, defaults to `true` (flat config).
       * @default true
       */
      useFlatConfig?: boolean
      dev?: Partial<{
        /** ESLint options that override the ones translated from `lintCommand`. */
        overrideConfig: ESLint.Options
        /**
         * Diagnostic levels to report.
         * @default ['error', 'warning']
         */
        logLevel: ('error' | 'warning')[]
        /**
         * How long to wait (in ms) after a file change before linting,
         * coalescing changes within the window into a single run.
         * @default 300
         */
        debounceMs: number
      }>
    }

/** Stylelint checker configuration */
export type StylelintConfig =
  | false
  | {
      /**
       * Paths to watch in dev mode, relative to the root. Defaults to the root.
       */
      watchPath?: string | string[]
      /**
       * Stylelint CLI command, such as `stylelint "./src/**\/*.css"`. Runs
       * as-is in build mode; in dev mode its options and file pattern are
       * passed to the Stylelint Node.js API.
       */
      lintCommand: string
      dev?: Partial<{
        /** Stylelint options that override the ones translated from `lintCommand`. */
        overrideConfig: Stylelint.LinterOptions
        /**
         * Diagnostic levels to report.
         * @default ['error', 'warning']
         */
        logLevel: ('error' | 'warning')[]
        /**
         * How long to wait (in ms) after a file change before linting,
         * coalescing changes within the window into a single run.
         * @default 300
         */
        debounceMs: number
      }>
    }

type BiomeCommand = 'lint' | 'check' | 'format' | 'ci'
/** Biome checker configuration */
export type BiomeConfig =
  | boolean
  | {
      /**
       * Biome command to run. Defaults to `lint` in dev mode and `check` in
       * build mode. Overridden by `dev.command` and `build.command`.
       */
      command?: BiomeCommand
      /**
       * CLI flags for the command. Overridden by `dev.flags` and `build.flags`.
       */
      flags?: string
      /**
       * Paths to watch in dev mode, relative to the root. Defaults to the root.
       */
      watchPath?: string | string[]
      dev?: Partial<{
        /** Biome command to run in dev mode. */
        command: BiomeCommand
        /** CLI flags for the command in dev mode. */
        flags?: string
        /**
         * Diagnostic levels to report.
         * @default ['error', 'warning', 'info']
         */
        logLevel: ('error' | 'warning' | 'info')[]
        /**
         * How long to wait (in ms) after a file change before linting,
         * coalescing changes within the window into a single run.
         * @default 300
         */
        debounceMs: number
      }>
      build?: Partial<{
        /** Biome command to run in build mode. */
        command: BiomeCommand
        /** CLI flags for the command in build mode. */
        flags?: string
      }>
    }

/** oxlint checker configuration */
export type OxlintConfig =
  | boolean
  | {
      /**
       * oxlint CLI command. Used in both dev and build mode.
       * @default 'oxlint'
       */
      lintCommand?: string
      /**
       * Paths to watch in dev mode, relative to the root. Defaults to the root.
       */
      watchPath?: string | string[]
      dev?: Partial<{
        /**
         * Diagnostic levels to report.
         * @default ['error', 'warning']
         */
        logLevel: ('error' | 'warning')[]
        /**
         * How long to wait (in ms) after a file change before linting,
         * coalescing changes within the window into a single run.
         * @default 300
         */
        debounceMs: number
      }>
    }

/** svelte-check checker configuration */
export type SvelteCheckConfig =
  | boolean
  | {
      /**
       * Flags passed to `svelte-check`, e.g. `'--tsconfig ./tsconfig.app.json'`.
       * In dev mode, `--watch` and `--output` are managed by the plugin.
       */
      flags?: string
      dev?: Partial<{
        /**
         * Diagnostic levels to report.
         * @default ['error', 'warning']
         */
        logLevel: ('error' | 'warning')[]
      }>
    }

export enum DiagnosticLevel {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3,
}

type ErrorPayloadErr = ErrorPayload['err']

/** Diagnostic posted from a checker worker to the main thread */
export interface DiagnosticRecord extends ErrorPayloadErr {
  checkerId: string
  level?: DiagnosticLevel
  /** rule that reported the diagnostic, as it appears in `message` */
  rule?: string
  /** documentation URL for `rule` */
  ruleUrl?: string
  /** error code, when it is not the `rule` */
  code?: string
  endLine?: number
  endColumn?: number
  snippet?: Snippet
}

/** Location passed to `overlay.editorUrl` */
export interface EditorLocation {
  /** absolute path of the file, as reported by the checker */
  file: string
  /** 1-based line number */
  line: number
  /** 1-based column number */
  column: number
}

/** checkers shared configuration */
export interface SharedConfig {
  /**
   * Show a badge and a diagnostics drawer on pages served by the dev server.
   * The same diagnostics are always available at `{base}__checker/`.
   * - Set `true` to show the overlay
   * - Set `false` to disable the overlay
   * - Set with a object to customize the overlay
   *
   * @defaultValue `true`
   */
  overlay:
    | boolean
    | {
        /**
         * Show the in-page badge and drawer.
         * - `'auto'`: show unless another integration, such as Nuxt, displays the
         *   diagnostics itself
         * - `true`: always show
         * - `false`: never show; diagnostics stay available at `{base}__checker/`
         * @defaultValue `'auto'`
         */
        badge?: boolean | 'auto'
        /**
         * Add a Checker panel and messages to
         * [Vite DevTools](https://devtools.vite.dev) when it is installed.
         * @defaultValue `true`
         */
        devtools?: boolean
        /**
         * Whether the drawer opens by itself when there are diagnostics, until
         * it is opened or closed by hand.
         * - `true`: open when there are errors or warnings
         * - `'error'`: open only when there are errors
         * - `false`: stay closed until the badge is clicked
         * @defaultValue `true`
         */
        initialIsOpen?: boolean | 'error'
        /**
         * Corner of the badge. The drawer opens along the same edge.
         * @defaultValue `'bl'`, or `'br'` when the Vite DevTools dock is shown
         */
        position?: 'tl' | 'tr' | 'bl' | 'br'
        /**
         * Build the URL opened when a file path is clicked in the overlay, such as
         * `vscode://file/...`. Return `undefined` to open the file with Vite's
         * `/__open-in-editor` endpoint instead.
         *
         * Called on the dev server, so it can map paths from a container to the host.
         *
         * @example
         * ```ts
         * editorUrl: ({ file, line, column }) =>
         *   `vscode://file${file.replace('/app', '/Users/me/project')}:${line}:${column}`
         * ```
         * @default no default value
         */
        editorUrl?: (location: EditorLocation) => string | undefined
      }
  /**
   * stdout in terminal which starts the Vite server in dev mode.
   * - Set `true` to enable
   * - Set `false` to disable
   *
   * @defaultValue `true`
   */
  terminal: boolean
  /**
   * Enable checking in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean
  /**
   * Directory the checkers run from. Defaults to the Vite root.
   */
  root?: string
}

export interface BuildInCheckers {
  typescript: TscConfig
  vueTsc: VueTscConfig
  eslint: EslintConfig
  stylelint: StylelintConfig
  biome: BiomeConfig
  oxlint: OxlintConfig
  svelteCheck: SvelteCheckConfig
}

export type BuildInCheckerNames = keyof BuildInCheckers

export type PluginConfig = SharedConfig & BuildInCheckers

/** Userland plugin configuration */
export type UserPluginConfig = Partial<PluginConfig>

/* ----------------------------- worker actions ----------------------------- */

export enum ACTION_TYPES {
  config = 'config',
  configureServer = 'configureServer',
  diagnostics = 'diagnostics',
  status = 'status',
  console = 'console',
}

interface AbstractAction {
  type: string
  payload: unknown
}

/** Every current diagnostic of the checker, replacing the previous set */
export interface DiagnosticsAction extends AbstractAction {
  type: ACTION_TYPES.diagnostics
  payload: DiagnosticRecord[]
}

export interface StatusAction extends AbstractAction {
  type: ACTION_TYPES.status
  payload: {
    status: Extract<CheckerStatus, 'checking' | 'failed'>
    error?: string
  }
}

export interface ConfigAction extends AbstractAction {
  type: ACTION_TYPES.config
  payload: ConfigActionPayload
}

/** Serialisable subset of Vite's resolved `server.watch` forwarded to lint checkers. */
export interface LintWatchOptions {
  usePolling?: boolean
  interval?: number
  binaryInterval?: number
}

export interface ConfigureServerAction extends AbstractAction {
  type: ACTION_TYPES.configureServer
  payload: {
    root: string
    watch?: LintWatchOptions
  }
}

export interface ConsoleAction extends AbstractAction {
  type: ACTION_TYPES.console
  level: 'info' | 'warn' | 'error'
  payload: string
}

interface ConfigActionPayload {
  enableTerminal: boolean
  terminalColors: boolean
  terminalHyperlinks: boolean
  env: ConfigEnv
}

export type Action =
  | ConfigAction
  | ConfigureServerAction
  | ConsoleAction
  | DiagnosticsAction
  | StatusAction

/* ----------------------------- internal types ----------------------------- */

// prepare for create serve & build checker

export type BuildCheckBin = BuildCheckBinStr | BuildCheckBinFn
export type BuildCheckBinStr = [string, ReadonlyArray<string>]
export type BuildCheckBinFn = (
  config: UserPluginConfig,
  context: { root: string },
) => [string, ReadonlyArray<string>]

export interface ConfigureServeChecker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuildChecker {
  name?: BuildInCheckerNames
  serve: ConfigureServeChecker
  build: { buildBin: BuildCheckBin; buildFile?: string }
}

/**
 * create serve & build checker
 */

export interface ServeChecker<T extends BuildInCheckerNames = any> {
  createDiagnostic: CreateDiagnostic<T>
}

export interface CheckerDiagnostic {
  config: (options: ConfigActionPayload) => unknown
  configureServer: (options: ConfigureServerAction['payload']) => unknown
}

export type CreateDiagnostic<T extends BuildInCheckerNames = any> = (
  config: Pick<BuildInCheckers, T> & SharedConfig,
) => CheckerDiagnostic
