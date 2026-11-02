import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      overlay: {
        editorUrl: ({ file, line, column }) =>
          `vscode://file${file.replace(import.meta.dirname, '/host/project').replaceAll('\\', '/')}:${line}:${column}`,
      },
      eslint: {
        lintCommand: 'eslint "./src/**/*.ts"',
      },
    }),
  ],
})
