# Checkers overview

vite-plugin-checker includes seven checkers. Each one wraps an existing tool, so it uses the same configuration files and reports the same diagnostics as running that tool yourself.

| Checker                                | Option        | Packages to install          | Accepts `true` |
| -------------------------------------- | ------------- | ---------------------------- | -------------- |
| [TypeScript](/checkers/typescript)     | `typescript`  | `typescript`                 | Yes            |
| [vue-tsc](/checkers/vue-tsc)           | `vueTsc`      | `vue-tsc`, `typescript`      | Yes            |
| [svelte-check](/checkers/svelte-check) | `svelteCheck` | `svelte-check`, `typescript` | Yes            |
| [ESLint](/checkers/eslint)             | `eslint`      | `eslint`                     | No             |
| [Biome](/checkers/biome)               | `biome`       | `@biomejs/biome`             | Yes            |
| [oxlint](/checkers/oxlint)             | `oxlint`      | `oxlint`                     | Yes            |
| [Stylelint](/checkers/stylelint)       | `stylelint`   | `stylelint`, `meow`          | No             |

## Enable a checker

Every checker is off by default. To enable one:

1. Install the packages it needs, listed in the table above, as dev dependencies of your project.
2. Set its option in the plugin config:
   - `true` uses the default configuration, for checkers that support it.
   - An object configures the checker. ESLint and Stylelint require an object with a `lintCommand`.
   - `false`, or leaving the option out, disables the checker.

```ts
checker({
  typescript: true,
  eslint: {
    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
  },
})
```

Options that apply to all checkers, such as `overlay` and `enableBuild`, are described in [Shared options](/reference/shared-options).

## Choose between checkers

- **For type checking**, use one of the type checkers: `typescript` for plain TypeScript and React, `vueTsc` for Vue, or `svelteCheck` for Svelte. `vueTsc` and `svelteCheck` also check `.ts` files, so you don't need to enable the `typescript` checker as well.
- **For linting**, use the linter your project already runs. The checker uses its configuration file, so the results match your editor and CI.

## Next steps

- [Dev and build modes](/guide/dev-and-build): see how each checker runs in dev mode and in build mode.
