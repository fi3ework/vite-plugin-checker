import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      eslint: {
        lintCommand: 'eslint .',
      },
    }),
  ],
})
