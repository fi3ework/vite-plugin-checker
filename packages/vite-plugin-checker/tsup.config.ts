import { defineConfig, Options } from 'tsup'
import { rename } from 'fs/promises'

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
    format: ['esm'],
    outDir: 'dist/esm',
    async onSuccess() {
      await rename(
        'dist/esm/checkers/vueTsc/languagePlugins.js',
        'dist/esm/checkers/vueTsc/languagePlugins.cjs'
      )
      await rename(
        'dist/esm/checkers/vueTsc/languagePlugins.js.map',
        'dist/esm/checkers/vueTsc/languagePlugins.cjs.map'
      )
    },
    ...shared,
  },
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
      await rename(
        'dist/cjs/checkers/vueTsc/languagePlugins.js.map',
        'dist/cjs/checkers/vueTsc/languagePlugins.cjs.map'
      )
    },
    ...shared,
  },
])
