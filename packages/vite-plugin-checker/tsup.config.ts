import chalk from 'chalk'
import { Plugin } from 'esbuild'
import { relative, join } from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src'],
  outDir: 'lib',
  splitting: false,
  bundle: false,
  format: ['esm'],
  sourcemap: true,
  // do not clean @runtime code on watch mode
  clean: false,
  target: 'node14',
  platform: 'node',
  dts: true,
  // esbuildPlugins: [
  // addImportExt(),
  // createPatchEsbuildDistPlugin()
  // ],
})

// copied from https://github.com/vitejs/vite/blob/5d6ea8efc36bfdcd8b70afa8e82026ad1ccc0a77/scripts/patchEsbuildDist.ts, with a slight modification :)
function createPatchEsbuildDistPlugin(): Plugin {
  return {
    name: 'patch-esbuild-dist',
    setup(build) {
      build.onEnd((result) => {
        const targetFile = result.outputFiles!.filter((f) => {
          return relative(__dirname, f.path) === join('lib', 'main.js')
        })[0]

        if (!targetFile) {
          console.error(chalk.red(`did not find targetFile`))
          process.exit(1)
        }

        const modifiedCode = patchEsbuildDist(targetFile.text, 'checker')

        if (modifiedCode) {
          Object.defineProperty(targetFile, 'text', { value: modifiedCode })
        }
      })
    },
  }
}

function patchEsbuildDist(_code: string, varName: string) {
  let code = _code
  const moduleExportsLine = `module.exports = __toCommonJS(main_exports);`

  if (code.includes(moduleExportsLine)) {
    // overwrite for cjs require('...')() usage
    code = code.replace(
      moduleExportsLine,
      `module.exports = ${varName};
${varName}['default'] = ${varName};`
    )

    console.log(chalk.bold(`patched with overwrite for cjs require('...')()`))
    return code
  } else {
    console.error(chalk.red(`post-esbuild bundling patch failed`))
    process.exit(1)
  }
}
