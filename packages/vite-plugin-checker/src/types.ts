import type { ErrorPayload, ConfigEnv } from 'vite'
import type { Worker } from 'node:worker_threads'
// @ts-ignore
import type * as Stylelint from 'stylelint'

/* ----------------------------- userland plugin options ----------------------------- */

/** Stylelint checker configuration */
export type StylelintConfig =
  | false
  | {
      /**
       * lintCommand will be executed at build mode, and will also be used as
       * default config for dev mode when options.stylelint.dev.stylelint is nullable.
       */
      lintCommand: string
      dev?: Partial<{
        /** You can override the options of translated from lintCommand. */
        overrideConfig: Stylelint.LinterOptions
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

export interface ClientDiagnosticPayload {
  event: 'vite-plugin-checker:error'
  data: {
    checkerId: string
    diagnostics: DiagnosticToRuntime[]
  }
}

export interface ClientReconnectPayload {
  event: 'vite-plugin-checker:reconnect'
  data: ClientDiagnosticPayload[]
}

export type ClientPayload = ClientDiagnosticPayload | ClientReconnectPayload

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
         * Set this true if you want the overlay to default to being open if
         * errors/warnings are found
         * @defaultValue `true`
         */
        initialIsOpen?: boolean | 'error'
        /**
         * The position of the vite-plugin-checker badge to open and close
         * the diagnostics panel
         * @default `bl`
         */
        position?: 'tl' | 'tr' | 'bl' | 'br'
        /**
         * Use this to add extra style string to the badge button, the string format is
         * [HTML element's style property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)
         * For example, if you want to hide the badge,
         * you can pass `display: none;` to the badgeStyle property
         * @default no default value
         */
        badgeStyle?: string
        /**
         * Use this to add extra style string to the diagnostic panel, the string format is
         * [HTML element's style property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)
         * For example, if you want to change the opacity of the panel,
         * you can pass `opacity: 0.8;` to the panelStyle property
         * @default no default value
         */
        panelStyle?: string
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
   * Configure root directory of checkers
   * @defaultValue no default value
   */
  root?: string
}

export interface Checker {
  createServeAndBuild: (config: unknown, env: ConfigEnv) => ServeAndBuildChecker
  options: unknown
}

// export interface PluginConfig extends SharedConfig {
//   checkers: any[]
// }

/** Userland plugin configuration */
export type UserPluginConfig = [any[], Partial<SharedConfig>?]

/* ----------------------------- worker actions ----------------------------- */

export enum ACTION_TYPES {
  config = 'config',
  configureServer = 'configureServer',
  overlayError = 'overlayError',
  console = 'console',
  unref = 'unref',
}

interface AbstractAction {
  type: string
  payload: unknown
}

export interface OverlayErrorAction extends AbstractAction {
  type: ACTION_TYPES.overlayError
  /**
   * send `ClientPayload` to raise error overlay
   * send `null` to clear overlay for current checker
   */
  payload: ClientPayload
}

export interface ConfigAction<T = unknown> extends AbstractAction {
  type: ACTION_TYPES.config
  payload: ConfigActionPayload<T>
}

export interface ConfigureServerAction extends AbstractAction {
  type: ACTION_TYPES.configureServer
  payload: {
    root: string
  }
}

export interface ConsoleAction extends AbstractAction {
  type: ACTION_TYPES.console
  payload: string
}

export interface UnrefAction extends AbstractAction {
  type: ACTION_TYPES.unref
}

type ConfigActionPayload<T = unknown> = CreateServeAndBuildParams<T>

export type Action =
  | ConfigAction
  | ConfigureServerAction
  | ConsoleAction
  | OverlayErrorAction
  | UnrefAction

/* ----------------------------- internal types ----------------------------- */

// prepare for create serve & build checker

export type BuildCheckBin<T = unknown> = BuildCheckBinStr | BuildCheckBinFn<T>
export type BuildCheckBinStr = [string, ReadonlyArray<string>]
export type BuildCheckBinFn<T = unknown> = (things: {
  checkerOptions: T
}) => [string, ReadonlyArray<string>]

export interface ConfigureServeChecker {
  worker: Worker
  config: (things: CreateServeAndBuildParams) => void
  configureServer: (serverConfig: ConfigureServerAction['payload']) => void
}

export interface ServeAndBuildChecker<T = unknown> {
  serve: ConfigureServeChecker
  build: { buildBin: BuildCheckBin<T>; buildFile?: string }
}

export interface FatServeAndBuildChecker {
  checker: ServeAndBuildChecker
  options: unknown
}

/**
 * create serve & build checker
 */

export interface ServeChecker<T = unknown> {
  createDiagnostic: CreateDiagnostic<T>
}

export type CreateDiagnostic<T = unknown> = () => CheckerDiagnostic<T>

export interface CheckerDiagnostic<T = unknown> {
  config: (options: ConfigActionPayload<T>) => unknown
  configureServer: (options: { root: string }) => unknown
}

/* ----------------------------- generic utility types ----------------------------- */

export interface CreateServeAndBuildParams<T = unknown> {
  checkerOptions: T
  sharedConfig: Partial<SharedConfig>
  env: ConfigEnv
}
