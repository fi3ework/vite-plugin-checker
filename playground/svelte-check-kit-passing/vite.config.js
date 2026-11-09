import { isMainThread } from 'node:worker_threads'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// The test harness starts the dev server from the repo root, but SvelteKit
// resolves routes from the working directory. Workers can't change it, and
// SvelteKit and svelte-check both load this config in one.
if (isMainThread) process.chdir(import.meta.dirname)

export default defineConfig({
  plugins: [
    sveltekit(),
    checker({
      svelteCheck: true,
    }),
  ],
})
