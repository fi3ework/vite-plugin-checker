import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [checker({ typescript: true, overlay: { position: 'tr' } })],
})
