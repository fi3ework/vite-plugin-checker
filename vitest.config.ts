import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './playground/**/*.*',
      './playground-temp/**/*.*',
    ],
    testTimeout: 20000,
    globalSetup: ['./scripts/vitestGlobalSetup.ts'],
  },
  esbuild: {
    target: 'node14',
  },
})
