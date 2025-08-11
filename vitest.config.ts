import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 80000 : 40000

export default defineConfig({
  test: {
    cache: false,
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
    globalSetup: [
      './playground/vitestGlobalSetup.ts',
      './scripts/vitestGlobalSetup.ts',
    ],
    projects: [
      {
        test: {
          name: 'unit',
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            './playground/**/*.*',
            './playground-temp/**/*.*',
          ],
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'serve',
          env: {
            PROJECT: 'serve',
          },
          include: ['./playground/**/*.spec.[tj]s'],
          setupFiles: ['./playground/vitestSetup.ts'],
          testTimeout: timeout,
          hookTimeout: timeout,
          globals: true,
        },
      },
      {
        test: {
          name: 'build',
          env: {
            PROJECT: 'build',
          },
          include: ['./playground/**/*.spec.[tj]s'],
          setupFiles: ['./playground/vitestSetup.ts'],
          testTimeout: timeout,
          hookTimeout: timeout,
          globals: true,
        },
      },
    ],
  },
  esbuild: {
    target: 'node14',
  },
})
