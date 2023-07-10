export interface TsConfigOptions {
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
}

/**
 * TypeScript checker configuration
 * @default true
 */
export type TscConfig =
  /**
   * - set to `true` to enable type checking with default configuration
   * - set to `false` to disable type checking, you can also remove `config.typescript` directly
   */
  Partial<TsConfigOptions>
