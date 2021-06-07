import type { HMRPayload, ServerOptions, ConfigEnv } from 'vite'
import type { Worker } from 'worker_threads'

/* ----------------------------- userland plugin options ----------------------------- */

type TscConfig = boolean | Partial<{ tsconfigPath: string; root: string }>
type VueTscConfig = boolean | Partial<{ root: string }>
type VlsConfig = ServeAndBuild

export interface PluginOptions {
  tsc: TscConfig
  vueTsc: VueTscConfig
  vls: VlsConfig
  /**
   * Use `"tsc"` or `"vue-tsc"` or an custom checker
   * @defaultValue `"tcs"`
   */
  // checker: 'tsc' | 'vue-tsc' | ServeAndBuild
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
   * Root path to find tsconfig file
   * @defaultValue
   * Same as [Vite config](https://vitejs.dev/config/#root)
   */
  root: string
  /**
   * Relative tsconfig path to {@link (PluginOptions:interface).root}
   * @defaultValue `"tsconfig.json"`
   */
  tsconfigPath: string
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

export type ServeCheckerFactory = (options?: unknown) => ServeChecker

export interface ServeChecker {
  createDiagnostic: CreateDiagnostic
}

export type BuildCheckBin = [string, ReadonlyArray<string>]

export interface ConfigureChecker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuild {
  serve: ConfigureChecker
  build: { buildBin: BuildCheckBin }
}

export interface DiagnosticOfCheck {
  config: (options: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }) => unknown
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic = (config?: Partial<PluginOptions>) => DiagnosticOfCheck
