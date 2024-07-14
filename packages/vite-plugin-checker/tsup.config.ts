import { copyFile } from 'node:fs/promises'
import { type Options, defineConfig } from 'tsup'

const shared: Options = {
  entry: ['src', '!src/checkers/vueTsc/languagePlugins.cjs'],
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
        js: '.js',
      }
    },
    async onSuccess() {
      await copyFile(
        'src/checkers/vueTsc/languagePlugins.cjs',
        'dist/cjs/checkers/vueTsc/languagePlugins.cjs',
      )
    },
    ...shared,
  },
  {
    format: ['esm'],
    outDir: 'dist/esm',
    async onSuccess() {
      await copyFile(
        'src/checkers/vueTsc/languagePlugins.cjs',
        'dist/esm/checkers/vueTsc/languagePlugins.cjs',
      )
    },
    ...shared,
  },
])
