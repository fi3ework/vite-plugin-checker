import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import ViteComponents from 'vite-plugin-components'
import checker from 'vite-plugin-checker'
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
  plugins: [createVuePlugin({}), ViteComponents({ transformer: 'vue2' }), checker({ vls: {} })],
  server: {
    port: 8080,
  },
})

export default config
