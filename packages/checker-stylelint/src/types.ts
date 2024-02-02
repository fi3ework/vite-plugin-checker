import type { LinterOptions } from 'stylelint'

/** Stylelint checker configuration */
export type StylelintOptions =
  | false
  | {
      /**
       * lintCommand will be executed at build mode, and will also be used as
       * default config for dev mode when options.stylelint.dev.stylelint is nullable.
       */
      lintCommand: string
      dev?: Partial<{
        /** You can override the options of translated from lintCommand. */
        overrideConfig: LinterOptions
        /** which level of the diagnostic will be emitted from plugin */
        logLevel: ('error' | 'warning')[]
      }>
    }
