# Stylelint

The Stylelint checker reports CSS problems using [Stylelint](https://stylelint.io) and your project's Stylelint configuration.

## Set up

1. Install Stylelint (version 16.26.1 or later), `meow`, and the configs and plugins your Stylelint config uses. The checker uses `meow` to parse `lintCommand`:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D stylelint meow
   ```

   ```bash [npm]
   npm install -D stylelint meow
   ```

   ```bash [yarn]
   yarn add -D stylelint meow
   ```

   ```bash [bun]
   bun add -d stylelint meow
   ```

   :::

2. Enable the checker with a `lintCommand`. Use the same command you'd run in your terminal or CI:

   ```ts
   checker({
     stylelint: {
       lintCommand: 'stylelint "./src/**/*.{css,vue}"',
     },
   })
   ```

## How `lintCommand` is used

- **In build mode**, the checker runs `lintCommand` as a Stylelint CLI command from the Vite root. The first word must be `stylelint`; it runs the `stylelint` binary installed in your project.
- **In dev mode**, the checker translates the CLI flags in `lintCommand` to [Stylelint Node.js API options](https://stylelint.io/user-guide/options), and lints the files that match its first file pattern. When a file changes, only that file is linted again.

Don't add `--fix` to `lintCommand`; Stylelint would modify your files while the dev server or build runs.

## Watch fewer files

By default, dev mode watches the whole Vite root, excluding `node_modules` and `.git`. In large projects, this can be slow or fail with `EMFILE: too many open files`. Set `watchPath` to watch only the directories you lint:

```ts
checker({
  stylelint: {
    lintCommand: 'stylelint "./src/**/*.{css,vue}"',
    watchPath: './src',
  },
})
```

## Override dev mode options

`dev.overrideConfig` takes [Stylelint options](https://stylelint.io/user-guide/options) that override the ones translated from `lintCommand`, in dev mode only:

```ts
checker({
  stylelint: {
    lintCommand: 'stylelint "./src/**/*.css"',
    dev: {
      overrideConfig: {
        cache: true,
      },
    },
  },
})
```

The final options are `{ cwd: root, ...translatedOptions, ...dev.overrideConfig }`.

## Options

| Option               | Type                                                                 | Default                | Description                                                                                                 |
| -------------------- | -------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lintCommand`        | `string`                                                             | Required               | Stylelint CLI command. See [How `lintCommand` is used](#how-lintcommand-is-used).                           |
| `watchPath`          | `string \| string[]`                                                 | The Vite root          | Paths to watch in dev mode, relative to the root.                                                           |
| `dev.overrideConfig` | [`Stylelint.LinterOptions`](https://stylelint.io/user-guide/options) | `undefined`            | Options that override the ones translated from `lintCommand` in dev mode.                                   |
| `dev.logLevel`       | `('error' \| 'warning')[]`                                           | `['error', 'warning']` | Diagnostic levels to report in dev mode.                                                                    |
| `dev.debounceMs`     | `number`                                                             | `300`                  | Time in milliseconds to wait after a change before linting. Changes within this window are linted together. |
