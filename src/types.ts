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

/** vue-tsc configuration */
export type VueTscConfig =
  | boolean
  | Partial<{
      /** root path of cwd */
      root: string
    }>

export interface PluginOptions {
  typescript: TscConfig
  vueTsc: VueTscConfig
  vls: ServeAndBuildConfig
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
  // /**
  //  * Root path to find tsconfig file
  //  * @defaultValue
  //  * Same as [Vite config](https://vitejs.dev/config/#root)
  //  */
  // root: string
  // /**
  //  * Relative tsconfig path to {@link (PluginOptions:interface).root}
  //  * @defaultValue `"tsconfig.json"`
  //  */
  // tsconfigPath: string
}

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

export interface ServeAndBuildConfig {
  serve: ConfigureServeChecker
  build: { buildBin: BuildCheckBin }
}

// create serve & build checker

export type ServeCheckerFactory = (options?: unknown) => ServeChecker

export interface ServeChecker {
  createDiagnostic: CreateDiagnostic
}

export interface CheckerDiagnostic {
  config: (options: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }) => unknown
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic = (config?: Partial<PluginOptions>) => CheckerDiagnostic
