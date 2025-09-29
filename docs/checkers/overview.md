# Checkers overview

vite-plugin-checkers provide built-in checkers. For now, it supports [TypeScript](/checkers/typescript), [ESLint](/checkers/eslint), [Biome](/checkers/biome), [vue-tsc](/checkers/vue-tsc), [VLS](/checkers/vls), [Stylelint](/checkers/stylelint), [oxlint](/checkers/oxlint).

## How to add a checker

- Set the checker property to `true` to use a checker with its default value (except ESLint and Stylelint).
- Leave the field blank or `false` will not use the checker.
- Make sure to install the peer dependencies that checker relies on (documented on each checker's page if needed).
- Checker can be enabled with an advanced object config.
- Use [config](/configuration/config) to control the common behaviors settings of checkers.
