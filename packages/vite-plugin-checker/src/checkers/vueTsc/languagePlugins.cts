import type ts from 'typescript'
import * as vue from '@vue/language-core'
import { removeEmitGlobalTypes } from 'vue-tsc'

const windowsPathReg = /\\/g

// #region copied from https://github.com/vuejs/language-tools/blob/0781998a29f176ad52c30d3139d5c78a5688bd5d/packages/tsc/index.ts
export function getLanguagePlugins(
  ts: typeof import('typescript'),
  options: ts.CreateProgramOptions,
) {
  const { configFilePath } = options.options
  const vueOptions =
    typeof configFilePath === 'string'
      ? vue.createParsedCommandLine(ts, ts.sys, configFilePath.replace(windowsPathReg, '/'))
          .vueOptions
      : vue.resolveVueCompilerOptions({})
  const writeFile = options.host!.writeFile.bind(options.host)
  options.host!.writeFile = (fileName, contents, ...args) => {
    return writeFile(fileName, removeEmitGlobalTypes(contents), ...args)
  }
  const vueLanguagePlugin = vue.createVueLanguagePlugin<string>(
    ts,
    (id) => id,
    () => '',
    (fileName) => {
      const fileMap = new vue.FileMap(options.host?.useCaseSensitiveFileNames?.() ?? false)
      for (const vueFileName of options.rootNames.map((rootName) =>
        rootName.replace(windowsPathReg, '/')
      )) {
        fileMap.set(vueFileName, undefined)
      }
      return fileMap.has(fileName)
    },
    options.options,
    vueOptions
  )
  return [vueLanguagePlugin]
}
// #endregion
