// @ts-check

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { checker } from 'vite-plugin-checker'
import { checker as ts } from '@vite-plugin-checker/typescript'

export default defineConfig({
  plugins: [react(), checker([ts()])],
})
