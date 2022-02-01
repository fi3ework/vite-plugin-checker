module.exports = {
  root: true,
  extends: ['alloy', 'alloy/typescript'],
  env: {
    jest: true,
  },
  globals: {
    page: 'readable',
    globalThis: 'readable',
  },
  plugins: ['svelte3'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  rules: {
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
}
