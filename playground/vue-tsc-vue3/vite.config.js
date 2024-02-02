import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { checker } from 'vite-plugin-checker'
import { checker as vueTsc } from '@vite-plugin-checker/vue-tsc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), checker([vueTsc()])],
})
