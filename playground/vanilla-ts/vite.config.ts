import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    checker({
      eslint: {
        lintCommand: 'eslint ./src --ext .ts',
      },
    }),
  ],
})
