import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Checker from 'vite-plugin-ts-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), Checker({ checker: 'vue-tsc' })],
})
