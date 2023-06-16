# ESLint

## Installation

1. Make sure [eslint](https://www.npmjs.com/package/eslint) and related plugins for your `eslintrc` are installed as peer dependencies.

   ::: warning
   **(Optional but highly recommended)** Install `optionator@^0.9.1` with your package manager. It's needed because of ESLint dependents on it. It's probably working fine even it's not installed as it's accessed as a phantom dependency. But when you set `hoist=false` of pnpm. It won't be accessible anymore without explicit installation.
   :::

2. Add `eslint` field to plugin config and `options.eslint.lintCommand` is required. The `lintCommand` is the same as the lint command of your project. The default root of the command uses Vite's [root](https://vitejs.dev/config/#root).

   :::tip
   Do not add `--fix` to the lint command since the plugin is only aiming at checking issues.
   :::

   ```js
   // e.g.
   export default {
     plugins: [
       checker({
         eslint: {
           // for example, lint .ts and .tsx
           lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
         },
       }),
     ],
   }
   ```

## Configuration

Advanced object configuration table of `options.eslint`

| field              | Type                                                                                                       | Default value          | Description                                                                                                                                                                                                              |
| :----------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| lintCommand        | `string`                                                                                                   | This value is required | `lintCommand` will be executed at build mode, and will also be used as default config for dev mode when `eslint.dev.eslint` is nullable.                                                                                 |
| dev.overrideConfig | [`ESLint.Options`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/eslint/index.d.ts) | `undefined`            | **(Only in dev mode)** You can override the options of the translated from `lintCommand`. Config priority: `const eslint = new ESLint({cwd: root, ...translatedOptions, ...pluginConfig.eslint.dev?.overrideConfig, })`. |
| dev.logLevel       | `('error' \| 'warning')[]`                                                                                 | `['error', 'warning']` | **(Only in dev mode)** Which level of ESLint should be emitted to terminal and overlay in dev mode                                                                                                                       |
dev.debounce | `number` | `undefined` | **(Only in dev mode)** The milliseconds for debounce. Avoid repeated formatting files when your editor set lint on save action, and avoid multiple checks in a short time |     