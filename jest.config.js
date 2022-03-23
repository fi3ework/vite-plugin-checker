// @ts-check

const ignoreInWindows = process.platform === 'win32' ? 'multiple-hmr' : null
const ignoreInNode12 = process.version.startsWith('v12.') ? 'vue3-vue-tsc' : null
const testPathIgnorePatterns = ['/node_modules/', ignoreInWindows, ignoreInNode12].filter(Boolean)

/** @type {import("@jest/types").Config.InitialOptions} */
const config = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./scripts/jestSetupFilesAfterEnv.ts'],
  testTimeout: process.env.CI ? 150000 : 60000,
  testEnvironment: './scripts/testEnvironment.js',
  collectCoverage: false,
  collectCoverageFrom: ['packages/*/src/**/*.ts', 'packages/*/lib/**/*.js'],
  detectOpenHandles: true,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  watchPathIgnorePatterns: ['<rootDir>/temp'],
  snapshotSerializers: ['jest-serializer-path'],
  forceExit: true,
  // @ts-ignore
  testPathIgnorePatterns,
}

module.exports = config
