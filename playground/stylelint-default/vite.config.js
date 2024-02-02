import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { checker as stylelint } from '@vite-plugin-checker/stylelint'

export default defineConfig({
  plugins: [
    checker([
      stylelint({
        lintCommand: 'stylelint "./**/*.css"',
      }),
    ]),
  ],
})
