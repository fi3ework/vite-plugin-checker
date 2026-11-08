import tseslint from 'typescript-eslint'

export default tseslint.config(...tseslint.configs.recommended, {
  rules: {
    'no-var': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
})
