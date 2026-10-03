import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    checker({
      enableBuild: false,
      eslint: {
        lintCommand: 'eslint "./**/*.js"',
        dev: {
          overrideConfig: {
            cwd: path.resolve(dirname, 'src'),
          },
        },
      },
    }),
  ],
})
