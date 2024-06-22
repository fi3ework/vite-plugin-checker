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
    format: ['cjs'],
    outDir: 'dist/cjs',
    shims: true,
    outExtension() {
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
      await rename(
        'dist/esm/checkers/vueTsc/languagePlugins.js',
        'dist/esm/checkers/vueTsc/languagePlugins.cjs'
      )
    },
    ...shared,
  },
])
