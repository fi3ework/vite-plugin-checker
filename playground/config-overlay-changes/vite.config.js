import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { checker as eslint } from '@vite-plugin-checker/eslint'

// https://vitejs.dev/config/
export default defineConfig({
  // config-edit-slot
  plugins: [
    checker([
      eslint({
        lintCommand: 'eslint ./src --ext .ts',
      }),
      // checker-edit-slot
    ]),
  ],
})
