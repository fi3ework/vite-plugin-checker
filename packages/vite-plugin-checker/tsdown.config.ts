import { copyFile } from 'node:fs/promises'
import { defineConfig, type UserConfig } from 'tsdown'

export function createConfig(
  overrides: Partial<UserConfig> = {},
): ReturnType<typeof defineConfig> {
  return defineConfig([
    {
      format: ['esm'],
      outDir: 'dist',
      entry: ['src/**/*.ts', '!src/sv.ts'],
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
      deps: { neverBundle: ['@vitejs/devtools-kit'] },
      async onSuccess() {
        await copyFile(
          'src/checkers/vueTsc/languagePlugins.cjs',
          'dist/checkers/vueTsc/languagePlugins.cjs',
        )
      },
      ...overrides,
    },
    // `sv add` installs the package without its dependencies, so the add-on
    // has to be a single file that only imports the `sv` peer dependency.
    {
      format: ['esm'],
      outDir: 'dist',
      entry: { sv: 'src/sv.ts' },
      clean: false,
      platform: 'node',
      fixedExtension: false,
      deps: { alwaysBundle: ['@sveltejs/sv-utils'] },
    },
  ])
}

export default createConfig()
