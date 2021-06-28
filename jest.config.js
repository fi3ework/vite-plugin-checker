// @ts-check

/** @type {import("@jest/types").Config.InitialOptions} */
const config = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  testTimeout: process.env.CI ? 60000 : 60000,
  collectCoverage: false,
  collectCoverageFrom: ['packages/*/src/**/*.ts'],
  detectOpenHandles: true,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}

module.exports = config
