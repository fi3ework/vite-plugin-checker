import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      overlay: { position: 'tr', badgeStyle: 'background-color: #E799B0' },
      eslint: {
        lintCommand: 'eslint ./src --ext .ts',
      },
    }),
  ],
})
