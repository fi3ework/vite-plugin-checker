# Stylelint

## Installation

1. Make sure [stylelint](https://www.npmjs.com/package/stylelint) and related plugins for your `stylelintrc` are installed as peer dependencies.

   ::: warning
   **(Optional but highly recommended)** Install `meow@^9.0.0` with your package manager. It's needed because of Stylelint dependents on it. It's probably working fine even it's not installed as it's accessed as a phantom dependency. But when you set `hoist=false` of pnpm. It won't be accessible anymore without explicit installation.
   :::

2. Add `stylelint` field to plugin config and `options.stylelint.lintCommand` is required. The `lintCommand` is the same as the lint command of your project. The default root of the command uses Vite's [root](https://vitejs.dev/config/#root).

   :::tip
   Do not add `--fix` to the lint command since the plugin is only aiming at check issues.
   :::

   ```js
   // e.g.
   export default {
     plugins: [
       checker({
         stylelint: {
           // for example, lint .css and .vue
           lintCommand: 'stylelint ./src/**/*.{css,vue}',
         },
       }),
     ],
   }
   ```

## Configuration

Advanced object configuration table of `options.stylelint`

| field              | Type                                                                                                     | Default value          | Description                                                                                                                                                                                                       |
| :----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lintCommand        | `string`                                                                                                 | This value is required | `lintCommand` will be executed at build mode, and will also be used as default config for dev mode when `stylelint.dev.stylelint` is nullable.                                                                    |
| dev.overrideConfig | [`Stylelint.LinterOptions`](https://github.com/stylelint/stylelint/blob/main/types/stylelint/index.d.ts) | `undefined`            | **(Only in dev mode)** You can override the options of the translated from `lintCommand`. Config priority: `stylelint.lint({ cwd: root, ...translatedOptions, ...pluginConfig.stylelint.dev?.overrideConfig, })`. |
| dev.logLevel       | `('error' \| 'warning')[]`                                                                               | `['error', 'warning']` | **(Only in dev mode)** Which level of Stylelint should be emitted to terminal and overlay in dev mode                                                                                                             |
