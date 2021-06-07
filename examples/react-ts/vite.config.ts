import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import Checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
<<<<<<< HEAD
  plugins: [reactRefresh(), TsChecker({overlay: false})],
=======
  plugins: [reactRefresh(), Checker()],
>>>>>>> fix: add simple vue-tsc
})
