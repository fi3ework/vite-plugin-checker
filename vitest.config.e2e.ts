import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 80000 : 40000

export default defineConfig({
  test: {
    cache: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        // singleFork: true,
      },
    },
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./playground/vitestSetup.ts'],
    globalSetup: ['./playground/vitestGlobalSetup.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    globals: true,
    reporters: 'dot',
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
  },
  esbuild: {
    target: 'node14',
  },
})
