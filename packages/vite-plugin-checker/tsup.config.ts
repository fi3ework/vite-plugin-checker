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

const createRenameFunction = (type: 'esm' | 'cjs') => async () => {
  try {
    await rename(
      `dist/${type}/checkers/vueTsc/languagePlugins.js`,
      `dist/${type}/checkers/vueTsc/languagePlugins.cjs`
    )
    await rename(
      `dist/${type}/checkers/vueTsc/languagePlugins.js.map`,
      `dist/${type}/checkers/vueTsc/languagePlugins.cjs.map`
    )
  } catch (e) {}
}

export default defineConfig([
  {
    format: ['esm'],
    outDir: 'dist/esm',
    onSuccess: createRenameFunction('esm'),
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
    onSuccess: createRenameFunction('cjs'),
    ...shared,
  },
])
