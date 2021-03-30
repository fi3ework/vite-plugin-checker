import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import TsChecker from 'vite-plugin-ts-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), TsChecker()],
})
