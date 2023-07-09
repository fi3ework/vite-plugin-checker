import { defineConfig, Options } from 'tsup'

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
    ...shared,
  },
])
