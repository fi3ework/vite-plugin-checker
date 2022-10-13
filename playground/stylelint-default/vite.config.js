import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      stylelint: {
        lintCommand: 'stylelint ./**/*.css',
      },
    }),
  ],
})
