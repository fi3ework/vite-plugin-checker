import type { ErrorPayload, ConfigEnv, CustomPayload } from 'vite'
import type { Worker } from 'worker_threads'
import type { ESLint } from 'eslint'
import type { VlsOptions } from './checkers/vls/initParams'

/* ----------------------------- userland plugin options ----------------------------- */

/**
 * TypeScript checker configuration
 * @default true
 */
export type TscConfig =
  /**
   * - set to `true` to enable type checking with default configuration
   * - set to `false` to disable type checking, you can also remove `config.typescript` directly
   */
  | boolean
  | Partial<{
      /**
       * path to tsconfig.json file
       */
      tsconfigPath: string
      /**
       * root path of cwd
       */
      root: string
      /**
       * root path of cwd
       */
      buildMode: boolean
    }>

/** vue-tsc checker configuration */
export type VueTscConfig =
  | boolean
  | Partial<{
      // TODO: support vue-tsc config
    }>

/** vls checker configuration */
export type VlsConfig = boolean | DeepPartial<VlsOptions>

/** ESLint checker configuration */
export type EslintConfig =
  | false
  | {
      /**
       * lintCommand will be executed at build mode, and will also be used as
       * default config for dev mode when options.eslint.dev.eslint is nullable.
       */
      lintCommand: string
      dev?: Partial<{
        /** You can override the options of translated from lintCommand. */
        overrideConfig: ESLint.Options
        /** which level of the diagnostic will be emitted from plugin */
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
export interface DiagnosticToRuntime extends ErrorPayloadErr {
  checkerId: string
  level?: DiagnosticLevel
}

/** checkers shared configuration */
export interface SharedConfig {
  /**
   * Show overlay on UI view when there are errors or warnings in dev mode.
   * - Set `true` to show overlay
   * - Set `false` to disable overlay
   * - Set with a object to customize overlay
   *
   * @defaultValue `true`
   */
  overlay:
    | boolean
    | {
        /**
         * Set this true if you want the overlay to default to being open if errors/warnings are found
         * @defaultValue `true`
         */
        initialIsOpen?: boolean
        /**
         * The position of the vite-plugin-checker badge to open and close the diagnostics panel
         * @default `bl`
         */
        position?: 'tl' | 'tr' | 'bl' | 'br'
        /**
         * Use this to add extra style to the badge button
         * For example, if you want to want with react-query devtool, you can pass 'margin-left: 100px;' to avoid the badge overlap with the react-query's
         */
        badgeStyle?: string
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
}

export interface BuildInCheckers {
  typescript: TscConfig
  vueTsc: VueTscConfig
  vls: VlsConfig
  eslint: EslintConfig
}

export type BuildInCheckerNames = keyof BuildInCheckers

export type PluginConfig = SharedConfig & BuildInCheckers

/** Userland plugin configuration */
export type UserPluginConfig = Partial<PluginConfig>

/* ----------------------------- worker actions ----------------------------- */

export enum ACTION_TYPES {
  config = 'config',
  configureServer = 'configureServer',
  overlayError = 'overlayError',
  console = 'console',
  unref = 'unref',
}

interface Action {
  type: string
  payload: unknown
}

export interface OverlayErrorAction extends Action {
  type: ACTION_TYPES.overlayError
  /**
   * send `CustomPayload` to raise error overlay provided by Vite
   * send `null` to clear overlay for current checker
   */
  payload: CustomPayload | null
}

interface ConfigActionPayload {
  enableOverlay: boolean
  enableTerminal: boolean
  env: ConfigEnv
}

export interface ConfigAction extends Action {
  type: ACTION_TYPES.config
  payload: ConfigActionPayload
}

export interface ConfigureServerAction extends Action {
  type: ACTION_TYPES.configureServer
  payload: {
    root: string
  }
}

export interface UnrefAction extends Action {
  type: ACTION_TYPES.unref
}

export type Actions = OverlayErrorAction | ConfigAction | ConfigureServerAction | UnrefAction

/* ----------------------------- internal types ----------------------------- */

// prepare for create serve & build checker

export type BuildCheckBin = BuildCheckBinStr | BuildCheckBinFn
export type BuildCheckBinStr = [string, ReadonlyArray<string>]
export type BuildCheckBinFn = (config: UserPluginConfig) => [string, ReadonlyArray<string>]

export interface ConfigureServeChecker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuildChecker {
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
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic<T extends BuildInCheckerNames = any> = (
  config: Pick<BuildInCheckers, T> & SharedConfig
) => CheckerDiagnostic

/* ----------------------------- generic utility types ----------------------------- */

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}
