module.exports = {
  root: true,
  extends: ['alloy', 'alloy/typescript'],
  env: {
    jest: true,
  },
  globals: {
    globalThis: 'readable',
  },
  rules: {
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
}
