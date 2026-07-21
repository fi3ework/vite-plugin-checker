import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 80000 : 40000

const playgroundProject = {
  pool: 'forks' as const,
  include: ['./playground/**/*.spec.[tj]s'],
  setupFiles: ['./playground/vitestSetup.ts'],
  globalSetup: [
    './playground/vitestGlobalSetup.ts',
    './scripts/vitestGlobalSetup.ts',
  ],
  testTimeout: timeout,
  hookTimeout: timeout,
  globals: true,
  reporters: 'dot' as const,
}

export default defineConfig({
  test: {
    cache: false,
    maxWorkers: 4,
    minWorkers: 1,
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
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
          globalSetup: ['./scripts/vitestGlobalSetup.ts'],
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'serve',
          ...playgroundProject,
        },
      },
      {
        test: {
          name: 'build',
          env: {
            VITE_TEST_BUILD: '1',
          },
          ...playgroundProject,
        },
      },
    ],
  },
  esbuild: {
    target: 'node14',
  },
})
