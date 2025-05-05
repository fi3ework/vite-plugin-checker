import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 80000 : 40000

export default defineConfig({
  test: {
    cache: false,
    reporters: 'dot',
    onConsoleLog(log) {
      if (log.match(/experimental|jit engine|emitted file|tailwind/i))
        return false
    },
    workspace: [
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
          globalSetup: ['./scripts/vitestGlobalSetup.ts'],
        }
      },
      {
        test: {
          name: 'e2e',
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
        }
      },
      {
        test: {
          name: 'e2e-build',
          env: {
            VITE_TEST_BUILD: '1'
          },
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
        }
      }
    ],
  },
  esbuild: {
    target: 'node14',
  },
})
