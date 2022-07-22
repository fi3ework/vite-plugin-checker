import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 50000 : 30000

export default defineConfig({
  resolve: {
    alias: {
      '~utils': resolve(__dirname, './playground/testUtils'),
      '~setup': resolve(__dirname, './playground/vitestSetup'),
    },
  },
  test: {
    cache: false,
    isolate: false,
    threads: false,
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./playground/vitestSetup.ts'],
    globalSetup: ['./playground/vitestGlobalSetup.ts'],
    testTimeout: timeout,
    hookTimeout: timeout,
    globals: true,
    reporters: 'dot',
    outputTruncateLength: 999999999,
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i)) return false
    },
  },
  esbuild: {
    target: 'node14',
  },
})
