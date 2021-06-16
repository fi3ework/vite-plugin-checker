module.exports = {
  extends: ['alloy', 'alloy/typescript'],
  env: {
    jest: true,
  },
  rules: {
    '@typescript-eslint/consistent-type-assertions': 'off',
  },
}
