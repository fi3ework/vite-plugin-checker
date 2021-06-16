module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
