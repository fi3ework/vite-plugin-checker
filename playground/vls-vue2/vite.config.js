import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { checker } from 'vite-plugin-checker'
import { checker as vls } from '@vite-plugin-checker/vls'
import { resolve } from 'node:path'

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
  plugins: [vue(), checker([vls()])],
})

export default config
