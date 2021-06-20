module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 30000 : 10000,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
