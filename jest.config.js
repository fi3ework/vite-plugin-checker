module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  testTimeout: process.env.CI ? 60000 : 60000,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
