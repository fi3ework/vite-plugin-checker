# svelte-check

The svelte-check checker runs [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check), which reports type errors, Svelte compiler warnings, and accessibility warnings in Svelte components and `.ts` files.

## Set up

In a Svelte or SvelteKit project, the [Svelte CLI](https://svelte.dev/docs/cli/overview) can do this for you. It installs the dependencies and adds the plugin to your Vite config:

::: code-group

```bash [pnpm]
pnpm dlx sv add vite-plugin-checker
```

```bash [npm]
npx sv add vite-plugin-checker
```

```bash [yarn]
yarn dlx sv add vite-plugin-checker
```

```bash [bun]
bunx sv add vite-plugin-checker
```

:::

The add-on:

- Adds `vite-plugin-checker` as a dev dependency, plus `svelte-check` and `typescript` if your project doesn't have them yet. Versions you already have are left alone.
- Imports `checker` in your Vite config and adds it to `plugins` with `svelteCheck` enabled. If the Vite config already references `vite-plugin-checker`, the add-on leaves it unchanged.
- Points svelte-check at `tsconfig.app.json` with `--tsconfig` when that file exists, as it does in the Vite template of `sv create`.
- Sets `enableBuild: false` if the project didn't have `svelte-check` before, so errors nobody has seen yet don't break `vite build`. Remove it once the project is clean to have the build fail on errors. See [`enableBuild`](/reference/shared-options#enablebuild).

To set it up by hand:

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
