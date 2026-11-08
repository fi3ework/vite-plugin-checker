import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(
      new URL('../vite-plugin-checker/dist/@ui', import.meta.url),
    ),
  },
})
