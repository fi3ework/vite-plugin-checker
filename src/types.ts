import type { HMRPayload, ServerOptions, ConfigEnv } from 'vite'
import type { Worker } from 'worker_threads'

export type CheckerFactory = (options?: unknown) => Checker

export type BuildCheckBin = [string, ReadonlyArray<string>]

export interface Checker {
  createDiagnostic: CreateDiagnostic
}

export interface DiagnosticOfCheck {
  config: (options: Pick<ServerOptions, 'hmr'> & { env: ConfigEnv }) => unknown
  configureServer: (options: { root: string }) => unknown
}

export type CreateDiagnostic = (config?: Partial<PluginOptions>) => DiagnosticOfCheck

export interface CheckWorker {
  worker: Worker
  config: (config: ConfigAction['payload']) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
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

/* ----------------------------- worker actions ----------------------------- */

export interface PluginOptions {
  /**
   * Use `"tsc"` or `"vue-tsc"` or an custom checker
   * @defaultValue `"tcs"`
   */
  checker: 'tsc' | 'vue-tsc' | Checker
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
