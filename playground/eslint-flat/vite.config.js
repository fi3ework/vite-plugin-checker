import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { checker as eslint } from '@vite-plugin-checker/eslint'

export default defineConfig({
  plugins: [
    checker([
      eslint({
        lintCommand: 'eslint "./src/**/*.js"',
        useFlatConfig: true,
      }),
    ]),
  ],
})
