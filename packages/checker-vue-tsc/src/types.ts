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

/** vue-tsc checker configuration */
export type VueTscConfig =
  /**
   * - set to `true` to enable type checking with default configuration
   * - set to `false` to disable type checking, you can also remove `config.vueTsc` directly
   */
  Partial<Omit<TsConfigOptions, 'buildMode'>>
