import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'tsdown'

export default defineConfig({
  format: ['esm'],
  outDir: 'dist',
  entry: ['src/**/*.ts', '!src/@runtime/**'],
  // Each checker entry doubles as its own worker_threads entry (spawned via
  // `new Worker(import.meta.url)`), so the per-file layout must be preserved
  // instead of being merged into a single bundle.
  unbundle: true,
  sourcemap: true,
  clean: true,
  platform: 'node',
  // The package is ESM-only, so emit `.js` instead of tsdown's node default
  // of `.mjs`; the exports map and the worker entries reference `.js` paths.
  fixedExtension: false,
  dts: true,
  async onSuccess() {
    await copyFile(
      'src/checkers/vueTsc/languagePlugins.cjs',
      'dist/checkers/vueTsc/languagePlugins.cjs',
    )
  },
})
