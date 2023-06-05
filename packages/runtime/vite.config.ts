import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteVueCESubStyle } from '@unplugin-vue-ce/sub-style'
import type { PluginOption } from 'vite'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue(), viteVueCESubStyle() as PluginOption],
  define: {
    'import.meta.hot': 'import.meta.hot',
  },
  build: {
    minify: false, // for easy to debug and the size is not that important
    emptyOutDir: true,
    outDir: path.resolve(__dirname, '../vite-plugin-checker/dist/@runtime'),
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: () => `main.js`,
    },
  },
})
