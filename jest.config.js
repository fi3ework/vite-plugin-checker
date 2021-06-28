module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  testTimeout: process.env.CI ? 60000 : 60000,
  collectCoverage: true,
  collectCoverageFrom: ['packages/*/src/**/*.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
