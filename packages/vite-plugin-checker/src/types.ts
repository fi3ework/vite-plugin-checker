import type { HMRPayload, ServerOptions, ConfigEnv } from 'vite'
import type { Worker } from 'worker_threads'

/* ----------------------------- userland plugin options ----------------------------- */

/** TypeScript checker configuration */
export type TscConfig =
  | boolean
  | Partial<{
      /** path to tsconfig.json file */
      tsconfigPath: string
      /** root path of cwd */
      root: string
    }>

/** vue-tsc checker configuration */
export type VueTscConfig =
  | boolean
  | Partial<{
      // TODO: support vue-tsc config
    }>

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
}

export type CustomChecker = (vlsConfig: any) => ServeAndBuildChecker

export interface CustomCheckers {
  // TODO: poor TS index signature type https://stackoverflow.com/questions/49969390/how-do-i-type-an-object-with-known-and-unknown-keys-in-typescript?noredirect=1&lq=1
  // should remove `| boolean`
  [k: string]: CustomChecker | boolean
}

export interface BuildInCheckers {
  typescript: TscConfig
  vueTsc: VueTscConfig
}

export type PluginConfig = SharedConfig & CustomCheckers & BuildInCheckers

/** Userland plugin configuration */
export type UserPluginConfig = Partial<PluginConfig>

/* ----------------------------- worker actions ----------------------------- */

export enum ACTION_TYPES {
  overlayError = 'overlayError',
  config = 'config',
  configureServer = 'configureServer',
}

interface Action {
  type: string
  payload: unknown
}

export interface OverlayErrorAction extends Action {
  type: ACTION_TYPES.overlayError
  payload: HMRPayload
}

export interface ConfigAction extends Action {
  type: ACTION_TYPES.config
  payload: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }
}

export interface ConfigureServerAction extends Action {
  type: ACTION_TYPES.configureServer
  payload: {
    root: string
  }
}

export type Actions = OverlayErrorAction | ConfigAction | ConfigureServerAction

/* ----------------------------- internal types ----------------------------- */

// prepare for create serve & build checker

export type BuildCheckBin = [string, ReadonlyArray<string>]

export interface ConfigureServeChecker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuildChecker {
  serve: ConfigureServeChecker
  build: { buildBin: BuildCheckBin }
}

// create serve & build checker

export interface ServeChecker {
  createDiagnostic: CreateDiagnostic
}

export interface CheckerDiagnostic {
  config: (options: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }) => unknown
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic<T = any> = (config: T & SharedConfig) => CheckerDiagnostic
