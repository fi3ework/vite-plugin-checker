import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  // config-edit-slot
  plugins: [
    checker({
      eslint: {
        lintCommand: 'eslint ./src --ext .ts',
      },
      // checker-edit-slot
    }),
  ],
})
