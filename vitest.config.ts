import { defineConfig } from 'vitest/config'

const timeout = process.env.CI ? 80000 : 40000
const svAddonTimeout = 180000

const playgroundProject = {
  pool: 'forks' as const,
  include: ['./playground/**/*.spec.[tj]s'],
  setupFiles: ['./playground/vitestSetup.ts'],
  globalSetup: ['./playground/vitestGlobalSetup.ts'],
  testTimeout: timeout,
  hookTimeout: timeout,
  globals: true,
  reporters: 'dot' as const,
}

export default defineConfig({
  test: {
    cache: false,
    maxWorkers: 4,
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
            './packages/vite-plugin-checker/__tests__/sv/**',
            './packages/vite-plugin-checker/.test-output/**',
            './packages/vite-plugin-checker/demo/**',
          ],
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'sv',
          include: ['./packages/vite-plugin-checker/__tests__/sv/*.spec.ts'],
          globalSetup: [
            './packages/vite-plugin-checker/__tests__/sv/globalSetup.ts',
          ],
          testTimeout: svAddonTimeout,
          hookTimeout: svAddonTimeout,
          expect: {
            requireAssertions: true,
          },
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
})
