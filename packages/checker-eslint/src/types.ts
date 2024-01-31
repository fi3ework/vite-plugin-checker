import type { ESLint } from 'eslint'

/** ESLint checker configuration */
export type EslintOptions =
  | false
  | {
      /**
       * lintCommand will be executed at build mode, and will also be used as
       * default config for dev mode when options.eslint.dev.eslint is nullable.
       */
      lintCommand: string
      /**
       * @default false
       */
      useFlatConfig?: boolean
      dev?: Partial<{
        /** You can override the options of translated from lintCommand. */
        overrideConfig: ESLint.Options
        /** which level of the diagnostic will be emitted from plugin */
        logLevel: ('error' | 'warning')[]
      }>
    }
