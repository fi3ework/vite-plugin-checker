// @ts-check

/** @type {import("@jest/types").Config.InitialOptions} */
const config = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  testTimeout: process.env.CI ? 100000 : 30000,
  collectCoverage: false,
  collectCoverageFrom: ['packages/*/src/**/*.ts', 'packages/*/lib/**/*.js'],
  detectOpenHandles: true,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  watchPathIgnorePatterns: ['<rootDir>/temp'],
}

module.exports = config
