import { defineConfig, Options } from 'tsup'
import { copyFile, rename, rm } from 'fs/promises'

const shared: Options = {
  entry: ['src'],
  splitting: false,
  bundle: false,
  sourcemap: true,
  clean: true,
  target: 'node14',
  platform: 'node',
  dts: true,
}

export default defineConfig([
  {
    format: ['cjs'],
    outDir: 'dist/cjs',
    shims: true,
    outExtension({ format }) {
      return {
        js: `.js`,
      }
    },
    async onSuccess() {
      await rename(
        'dist/cjs/checkers/vueTsc/languagePlugins.js',
        'dist/cjs/checkers/vueTsc/languagePlugins.cjs'
      )
    },
    ...shared,
  },
  {
    format: ['esm'],
    outDir: 'dist/esm',
    async onSuccess() {
      await rm('dist/esm/checkers/vueTsc/languagePlugins.js')
      await copyFile(
        'dist/cjs/checkers/vueTsc/languagePlugins.cjs',
        'dist/esm/checkers/vueTsc/languagePlugins.cjs'
      )
    },
    ...shared,
  },
])
