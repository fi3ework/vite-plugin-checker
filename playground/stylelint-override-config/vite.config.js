import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      enableBuild: false,
      stylelint: {
        lintCommand: 'stylelint "./src/**/*.css"',
        dev: {
          overrideConfig: {
            config: { rules: { 'color-no-hex': true } },
          },
        },
      },
    }),
  ],
})
