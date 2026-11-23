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

## Set up with the Svelte CLI

The [Svelte CLI](https://svelte.dev/docs/cli/overview) can do the steps above for you:

```bash
npx sv add vite-plugin-checker
```

The add-on:

- Adds `vite-plugin-checker`, `svelte-check` and `typescript` as dev dependencies if your project doesn't have them yet. Versions you already have are left alone.
- Imports `checker` in `vite.config.ts` or `vite.config.js` and adds it to `plugins` with `svelteCheck` enabled. If the config already references `vite-plugin-checker`, or has another file extension, the add-on leaves it unchanged and you enable `svelteCheck` by hand.
- Points svelte-check at `tsconfig.app.json` with `--tsconfig` when that file exists, as it does in projects created with `create-vite`.
- Sets `enableBuild: false` if the project didn't have `svelte-check` before, so errors nobody has seen yet don't break `vite build`. Remove it once the project is clean to have the build fail on errors. See [`enableBuild`](/reference/shared-options#enablebuild).

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
