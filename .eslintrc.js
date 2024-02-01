const { builtinModules } = require('node:module')

module.exports = {
  root: true,
  extends: ['alloy', 'alloy/typescript'],
  plugins: ['i'],
  globals: {
    page: 'readonly',
    globalThis: 'readonly',
    __HMR_HOSTNAME__: 'readonly',
    __HMR_PORT__: 'readonly',
    __HMR_PROTOCOL__: 'readonly',
    __HMR_BASE__: 'readonly',
    __dirname: 'off',
    __filename: 'off',
  },
  rules: {
    'max-nested-callbacks': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'i/no-nodejs-modules': ['error', { allow: builtinModules.map((mod) => `node:${mod}`) }],
  },
}
