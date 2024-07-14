const path = require('node:path')
const { removeEmitGlobalTypes } = require('vue-tsc')

const vueTscDir = path.dirname(require.resolve('vue-tsc/package.json'))
const vue = /** @type {typeof import('@vue/language-core')} */ (
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
      : vue.resolveVueCompilerOptions({})
  const host = /** @type {import('typescript').CompilerHost} */ (options.host)
  const writeFile = host.writeFile.bind(host)
  host.writeFile = (fileName, contents, ...args) => {
    return writeFile(fileName, removeEmitGlobalTypes(contents), ...args)
  }
  const vueLanguagePlugin = vue.createVueLanguagePlugin(
    ts,
    (id) => id,
    () => '',
    (fileName) => {
      const fileMap = new vue.FileMap(
        host?.useCaseSensitiveFileNames?.() ?? false,
      )
      for (const vueFileName of options.rootNames.map((rootName) =>
        rootName.replace(windowsPathReg, '/'),
      )) {
        fileMap.set(vueFileName, undefined)
      }
      return fileMap.has(fileName)
    },
    options.options,
    vueOptions,
  )
  return [vueLanguagePlugin]
}
// #endregion
