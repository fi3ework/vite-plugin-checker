// @ts-check

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
}

module.exports = config
