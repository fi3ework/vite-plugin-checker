import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import ViteComponents from 'vite-plugin-components'
import Checker from 'vite-plugin-checker'
// import { VlsChecker } from 'vite-plugin-checker-vls'
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
    // @ts-ignore
    Checker({ vls: {} }),
  ],
  server: {
    port: 8080,
  },
})

export default config
