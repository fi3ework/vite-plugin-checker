import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src'],
  outDir: 'dist',
  splitting: false,
  bundle: false,
  format: ['esm'],
  sourcemap: true,
  // do not clean @runtime code on watch mode
  clean: false,
  target: 'node14',
  platform: 'node',
  dts: true,
})
