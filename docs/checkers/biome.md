# Biome

The Biome checker reports lint, format, and import-sorting problems using [Biome](https://biomejs.dev) and your project's `biome.json`.

## Set up

1. Install Biome (version 2.4.12 or later):

   ::: code-group

   ```bash [pnpm]
   pnpm add -D @biomejs/biome
   ```

   ```bash [npm]
   npm install -D @biomejs/biome
   ```

   ```bash [yarn]
   yarn add -D @biomejs/biome
   ```

   ```bash [bun]
   bun add -d @biomejs/biome
   ```

   :::

2. Enable the checker:

   ```ts
   checker({
     biome: true,
   })
   ```

With `biome: true`, dev mode runs `biome lint` and build mode runs `biome check`. Both run from the Vite root.

## Choose the command and flags

Set `command` to one of `'lint'`, `'check'`, `'format'`, or `'ci'`, and `flags` to pass [Biome CLI flags](https://biomejs.dev/reference/cli/). These apply in both modes:

```ts
checker({
  biome: {
    command: 'check',
    flags: '--diagnostic-level=warn',
  },
})
```

To use different values per mode, set `dev` or `build`. They take precedence over the top-level `command` and `flags`:

```ts
checker({
  biome: {
    dev: {
      command: 'lint',
    },
    build: {
      command: 'ci',
      flags: '--reporter=github',
    },
  },
})
```

In dev mode, the checker reads Biome's JSON output, so it ignores `--reporter` and `--reporter-file` and prints a warning. Use `build.flags` to set a reporter for build mode.

Don't pass `--write` or `--fix`; Biome would modify your files while the dev server or build runs.

## How dev mode works

When the dev server starts, the checker runs Biome on the whole project. When a file changes, it runs Biome on the changed files only. When `biome.json` changes, it runs on the whole project again.

To watch fewer files, set `watchPath`:

```ts
checker({
  biome: {
    watchPath: './src',
  },
})
```

## Options

| Option           | Type                                    | Default                             | Description                                                                                                 |
| ---------------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `command`        | `'lint' \| 'check' \| 'format' \| 'ci'` | `'lint'` in dev, `'check'` in build | Biome command to run.                                                                                       |
| `flags`          | `string`                                | `''`                                | CLI flags for the command.                                                                                  |
| `watchPath`      | `string \| string[]`                    | The Vite root                       | Paths to watch in dev mode, relative to the root.                                                           |
| `dev.command`    | `'lint' \| 'check' \| 'format' \| 'ci'` | `command`                           | Biome command to run in dev mode.                                                                           |
| `dev.flags`      | `string`                                | `flags`                             | CLI flags for the command in dev mode.                                                                      |
| `dev.logLevel`   | `('error' \| 'warning' \| 'info')[]`    | `['error', 'warning', 'info']`      | Diagnostic levels to report in dev mode.                                                                    |
| `dev.debounceMs` | `number`                                | `300`                               | Time in milliseconds to wait after a change before linting. Changes within this window are linted together. |
| `build.command`  | `'lint' \| 'check' \| 'format' \| 'ci'` | `command`                           | Biome command to run in build mode.                                                                         |
| `build.flags`    | `string`                                | `flags`                             | CLI flags for the command in build mode.                                                                    |
