# Checkers overview

vite-plugin-checkers provide built-in checkers. For now, it provides [TypeScript](/checkers/typescript), [ESLint](/checkers/eslint), [vue-tsc](/checkers/vue-tsc), [VLS](/checkers/vls).

## How to add a checker

- Set to `true` to use a checker with its default value (except ESLint).
- Leave the field blank or `false` to disable the checker.
- Make sure to install the peer dependencies indicated of each checker.
- Checker can be enabled with an advanced object config.
