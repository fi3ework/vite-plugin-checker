import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { checker as eslint } from '@vite-plugin-checker/eslint'

export default defineConfig({
  plugins: [
    checker(
      [
        eslint({
          lintCommand: 'eslint ./src --ext .ts',
        }),
      ],
      {
        overlay: {
          position: 'tr',
          badgeStyle: 'background-color: #E799B0',
          panelStyle: 'background-color: #A4C1FF;',
        },
      }
    ),
  ],
})
