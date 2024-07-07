// @ts-check
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      biome: true,
    }),
  ],
})
