import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import ViteComponents from 'vite-plugin-components'
import TsChecker from 'vite-plugin-ts-checker'
import vlsChecker from 'vite-plugin-ts-checker-preset-vls'
import { resolve } from 'path'

const config = defineConfig({
  resolve: {
    alias: {
      '@': `${resolve(__dirname, 'src')}`,
    },
  },
  base: '/vue-template/',
  build: {
    minify: true,
  },
  plugins: [
    createVuePlugin({}),
    ViteComponents({ transformer: 'vue2' }),
    TsChecker({
      checker: vlsChecker(),
    }),
  ],
  server: {
    port: 8080,
  },
})

export default config
