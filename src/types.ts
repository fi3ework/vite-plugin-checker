import type { Plugin } from 'vite'

export type CheckerFactory = (options?: unknown) => Checker

export interface Checker {
  buildBin: [string, ReadonlyArray<string>]
  createDiagnostic: CreateDiagnostic
}

export type CreateDiagnostic = (
  config?: Partial<PluginOptions>
) => Required<Pick<Plugin, 'config' | 'configureServer'>>

export interface PluginOptions {
  /**
   * Use `"tsc"` or `"vue-tsc"` or an custom checker
   * @defaultValue `"tcs"`
   */
  checker: 'tsc' | 'vue-tsc' | Checker
  /**
   * Throw in build mode if has error
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
   * Same as Vite https://vitejs.dev/config/#root
   */
  root: string
  /**
   * Relative tsconfig path to {@link (PluginOptions:interface).root}
   * @defaultValue `"tsconfig.json"`
   */
  tsconfigPath: string
}
