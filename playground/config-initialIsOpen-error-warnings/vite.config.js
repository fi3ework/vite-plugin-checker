import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      overlay: {
        initialIsOpen: 'error',
      },
      eslint: {
        lintCommand: 'eslint ./src --ext .ts',
      },
    }),
  ],
})
