import { DevTools } from '@vitejs/devtools'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [DevTools({ clientAuth: false }), checker({ typescript: true })],
})
