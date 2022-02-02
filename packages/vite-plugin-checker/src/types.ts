import type { ErrorPayload, ConfigEnv, CustomPayload } from 'vite'
import type { Worker } from 'worker_threads'
import type { ESLint } from 'eslint'
import type { VlsOptions } from './checkers/vls/initParams'

/* ----------------------------- userland plugin options ----------------------------- */

/** TypeScript checker configuration */
export type TscConfig =
  | boolean
  | Partial<{
      /** path to tsconfig.json file */
      tsconfigPath: string
      /** root path of cwd */
      root: string
      /** root path of cwd */
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
      dev?: {
        /** You can override the options of translated from lintCommand. */
        eslint?: ESLint.Options
      }
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
   * Enable checking in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean
  /**
   * Show overlay when has TypeScript error
   * @defaultValue
   * Same as [Vite config](https://vitejs.dev/config/#root)
   */
  overlay: boolean
  /**
   * logger
   */
  // logger: ((...args: any[]) => void)[]
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
  // hmr?: { overlay?: boolean } | boolean
  enableOverlay: boolean
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
