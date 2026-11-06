# ESLint

The ESLint checker reports lint problems using your project's ESLint configuration. It supports ESLint 9 and later, with flat config (`eslint.config.js`) by default.

## Set up

1. Install ESLint and the plugins your config uses:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D eslint
   ```

   ```bash [npm]
   npm install -D eslint
   ```

   ```bash [yarn]
   yarn add -D eslint
   ```

   ```bash [bun]
   bun add -d eslint
   ```

   :::

2. Enable the checker with a `lintCommand`. Use the same command you'd run in your terminal or CI:

   ```ts
   checker({
     eslint: {
       lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
     },
   })
   ```

## How `lintCommand` is used

- **In build mode**, the checker runs `lintCommand` as an ESLint CLI command from the Vite root. The first word must be `eslint`; it runs the `eslint` binary installed in your project.
- **In dev mode**, the checker translates the CLI flags in `lintCommand` to [ESLint Node.js API options](https://eslint.org/docs/latest/integrate/nodejs-api#parameters), and lints the files that match its patterns. When a file changes, only that file is linted again. Files ignored by your ESLint config are skipped.

Some flags only have an effect in the CLI, so they don't apply in dev mode. For example, `--max-warnings` and `--quiet` only affect build mode.

Don't add `--fix` to `lintCommand`. In dev mode, the checker refuses to start with it; in build mode, ESLint would modify your files during the build.

## Hide warnings in build mode

Add `--quiet` to `lintCommand` to report only errors during `vite build`:

```ts
checker({
  eslint: {
    lintCommand: 'eslint --quiet "./src/**/*.{ts,tsx}"',
  },
})
```

In dev mode, `--quiet` has no effect. To hide warnings there, set `dev.logLevel`:

```ts
checker({
  eslint: {
    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
    dev: {
      logLevel: ['error'],
    },
  },
})
```

## Watch fewer files

By default, dev mode watches the whole Vite root, excluding `node_modules` and `.git`. In large projects, this can be slow or fail with `EMFILE: too many open files`. Set `watchPath` to watch only the directories you lint:

```ts
checker({
  eslint: {
    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
    watchPath: ['./src', './lib'],
  },
})
```

## Override dev mode options

`dev.overrideConfig` takes [ESLint options](https://eslint.org/docs/latest/integrate/nodejs-api#parameters) that override the ones translated from `lintCommand`, in dev mode only:

```ts
checker({
  eslint: {
    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
    dev: {
      overrideConfig: {
        cache: true,
      },
    },
  },
})
```

The final options are `{ cwd: root, ...translatedOptions, ...dev.overrideConfig }`.

## Bulk suppressions

With ESLint 10.1 or later, dev mode applies [bulk suppressions](https://eslint.org/docs/latest/use/suppressions) from `eslint-suppressions.json`, as the CLI does in build mode. If you store the file elsewhere, pass `--suppressions-location` in `lintCommand`.

## Legacy eslintrc config

ESLint 9 can still use an `.eslintrc` config. To use it, set `useFlatConfig: false`. ESLint 10 and later only support flat config, so this option is ignored there.

## Options

| Option               | Type                                                                               | Default                | Description                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lintCommand`        | `string`                                                                           | Required               | ESLint CLI command. See [How `lintCommand` is used](#how-lintcommand-is-used).                              |
| `watchPath`          | `string \| string[]`                                                               | The Vite root          | Paths to watch in dev mode, relative to the root.                                                           |
| `useFlatConfig`      | `boolean`                                                                          | `true`                 | Use flat config. Set `false` to use eslintrc with ESLint 9.                                                 |
| `dev.overrideConfig` | [`ESLint.Options`](https://eslint.org/docs/latest/integrate/nodejs-api#parameters) | `undefined`            | Options that override the ones translated from `lintCommand` in dev mode.                                   |
| `dev.logLevel`       | `('error' \| 'warning')[]`                                                         | `['error', 'warning']` | Diagnostic levels to report in dev mode.                                                                    |
| `dev.debounceMs`     | `number`                                                                           | `300`                  | Time in milliseconds to wait after a change before linting. Changes within this window are linted together. |
