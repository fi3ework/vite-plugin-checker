import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: true,
    outDir: fileURLToPath(
      new URL('../vite-plugin-checker/dist/@runtime', import.meta.url),
    ),
    lib: {
      entry: fileURLToPath(new URL('./src/overlay/main.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'main.js',
    },
  },
})
