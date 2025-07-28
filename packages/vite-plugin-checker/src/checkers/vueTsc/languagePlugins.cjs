const path = require('node:path')

const vueTscDir = path.dirname(require.resolve('vue-tsc/package.json'))
const vue =
  /** @type {typeof import('@vue/language-core')} */ (
    require(require.resolve('@vue/language-core', { paths: [vueTscDir] }))
  )
const windowsPathReg = /\\/g

// #region copied from https://github.com/vuejs/language-tools/blob/0781998a29f176ad52c30d3139d5c78a5688bd5d/packages/tsc/index.ts
/**
 * @param {typeof import('typescript')} ts
 * @param {import('typescript').CreateProgramOptions} options
 */
exports.getLanguagePlugins = (ts, options) => {
  const { configFilePath } = options.options
  const vueOptions =
    typeof configFilePath === 'string'
      ? vue.createParsedCommandLine(
          ts,
          ts.sys,
          configFilePath.replace(windowsPathReg, '/'),
        ).vueOptions
      : vue.getDefaultCompilerOptions()
  vue.writeGlobalTypes(vueOptions, ts.sys.writeFile)
  const vueLanguagePlugin = vue.createVueLanguagePlugin(
    ts,
    options.options,
    vueOptions,
    (id) => id,
  )
  return [vueLanguagePlugin]
}
// #endregion
