import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      overlay: {
        position: 'tr',
      },
      eslint: {
        lintCommand: 'eslint "./src/**/*.ts"',
      },
    }),
  ],
})
