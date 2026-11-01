import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    svelte(),
    checker({
      svelteCheck: true,
    }),
  ],
})
