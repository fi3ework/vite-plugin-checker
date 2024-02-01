import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

const shared: Options = {
  entry: ['src'],
  splitting: false,
  bundle: false,
  sourcemap: true,
  clean: true,
  target: 'node14',
  platform: 'node',
  dts: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    }
  },
}

export default defineConfig([
  {
    format: ['esm'],
    outDir: 'dist/esm',
    ...shared,
  },
  {
    format: ['cjs'],
    outDir: 'dist/cjs',
    shims: true,
    ...shared,
  },
])
