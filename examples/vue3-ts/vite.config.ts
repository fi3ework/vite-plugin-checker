import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import TsChecker from 'vite-plugin-ts-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), TsChecker({ checker: 'vue-tsc' })],
})
