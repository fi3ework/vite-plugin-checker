import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { checker } from 'vite-plugin-checker'
import { checker as ts } from '@vite-plugin-checker/typescript'
import { checker as eslint } from '@vite-plugin-checker/eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker([
      ts(),
      eslint({
        lintCommand: 'eslint ./src --ext .ts,.tsx',
      }),
    ]),
  ],
})
