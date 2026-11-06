# svelte-check

The svelte-check checker runs [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check), which reports type errors, Svelte compiler warnings, and accessibility warnings in Svelte components and `.ts` files.

## Set up

1. Install `svelte-check` (version 4 or later) and TypeScript:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D svelte-check typescript
   ```

   ```bash [npm]
   npm install -D svelte-check typescript
   ```

   ```bash [yarn]
   yarn add -D svelte-check typescript
   ```

   ```bash [bun]
   bun add -d svelte-check typescript
   ```

   :::

2. Enable the checker:

   ```ts
   checker({
     svelteCheck: true,
   })
   ```

In dev mode, the checker runs `svelte-check --watch` from the Vite root. In build mode, it runs `svelte-check`.

## Pass flags to svelte-check

Use `flags` to pass [svelte-check CLI flags](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check#usage), for example to choose a tsconfig:

```ts
checker({
  svelteCheck: {
    flags: '--tsconfig ./tsconfig.app.json',
  },
})
```

In dev mode, the checker manages `--watch`, `--preserveWatchOutput`, and `--output` itself, so those flags only apply in build mode. `--workspace` applies in both modes and defaults to the Vite root.

## Options

| Option         | Type                       | Default                | Description                              |
| -------------- | -------------------------- | ---------------------- | ---------------------------------------- |
| `flags`        | `string`                   | `''`                   | CLI flags for `svelte-check`.            |
| `dev.logLevel` | `('error' \| 'warning')[]` | `['error', 'warning']` | Diagnostic levels to report in dev mode. |
