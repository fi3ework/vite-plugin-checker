# oxlint

The oxlint checker reports lint problems using [oxlint](https://oxc.rs/docs/guide/usage/linter) and your project's oxlint configuration.

## Set up

1. Install oxlint:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D oxlint
   ```

   ```bash [npm]
   npm install -D oxlint
   ```

   ```bash [yarn]
   yarn add -D oxlint
   ```

   ```bash [bun]
   bun add -d oxlint
   ```

   :::

2. Enable the checker:

   ```ts
   checker({
     oxlint: true,
   })
   ```

With `oxlint: true`, the checker runs `oxlint` from the Vite root in both dev and build mode.

## Customize the command

Set `lintCommand` to pass [oxlint CLI flags](https://oxc.rs/docs/guide/usage/linter/cli). The same command runs in both modes:

```ts
checker({
  oxlint: {
    lintCommand: 'oxlint -D correctness ./src',
  },
})
```

In dev mode, the checker reads oxlint's JSON output, so it replaces any `--format` or `-f` flag with `--format json` and prints a warning.

Don't pass `--fix`; oxlint would modify your files while the dev server or build runs.

## Hide warnings

Add `--quiet` to `lintCommand` to report errors only. Because `lintCommand` also runs in dev mode, this hides warnings in both modes. To hide them only in build mode, choose the command based on Vite's `command`:

```ts
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig(({ command }) => ({
  plugins: [
    checker({
      oxlint: {
        lintCommand: command === 'build' ? 'oxlint --quiet' : 'oxlint',
      },
    }),
  ],
}))
```

## How dev mode works

When any watched file changes, the checker runs `lintCommand` on the whole project again. This keeps the results of cross-file rules, such as `import/no-cycle`, accurate.

To watch fewer files, set `watchPath`:

```ts
checker({
  oxlint: {
    watchPath: './src',
  },
})
```

## Options

| Option           | Type                       | Default                | Description                                                                                                 |
| ---------------- | -------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lintCommand`    | `string`                   | `'oxlint'`             | oxlint CLI command, used in both dev and build mode.                                                        |
| `watchPath`      | `string \| string[]`       | The Vite root          | Paths to watch in dev mode, relative to the root.                                                           |
| `dev.logLevel`   | `('error' \| 'warning')[]` | `['error', 'warning']` | Diagnostic levels to report in dev mode.                                                                    |
| `dev.debounceMs` | `number`                   | `300`                  | Time in milliseconds to wait after a change before linting. Changes within this window are linted together. |
