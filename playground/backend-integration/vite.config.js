import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { checker } from 'vite-plugin-checker'
import { checker as ts } from '@vite-plugin-checker/typescript'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // generate manifest.json in outDir
    manifest: true,
    rollupOptions: {
      input: './src/main.tsx',
    },
  },
  plugins: [react(), checker([ts()])],
})
