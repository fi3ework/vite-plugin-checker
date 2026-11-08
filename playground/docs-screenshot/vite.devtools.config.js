import { DevTools } from '@vitejs/devtools'
import { defineConfig } from 'vite'
import config from './vite.config.js'

export default defineConfig({
  ...config,
  plugins: [DevTools({ clientAuth: false }), ...config.plugins],
})
