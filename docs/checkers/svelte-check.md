# svelte-check

You can use the svelte-check checker for your Svelte project.

## Installation

1. Make sure [svelte-check](https://www.npmjs.com/package/svelte-check) is installed as a peer dependency of your Vite project.

   ```bash
   pnpm add svelte-check typescript -D
   ```

2. Add `svelteCheck` field to plugin config. Valid options are either `true` or a configuration object. See the [svelte-check documentation](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check#usage) for the available flags. The command runs from Vite's [root](https://vitejs.dev/config/#root).

   ```js
   // e.g.
   export default {
     plugins: [
       checker({
         svelteCheck: true,
         // or
         svelteCheck: {
           flags: '--tsconfig ./tsconfig.app.json',
         },
       }),
     ],
   }
   ```

   :::tip
   In dev mode, svelte-check runs with `--watch --output machine-verbose`, so `--watch`, `--preserveWatchOutput` and `--output` in `flags` only apply to build mode.
   :::

## Configuration

Advanced object configuration table of `options.svelteCheck`

| field        | Type                       | Default value          | Description                                                                                               |
| :----------- | -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| flags        | `string`                   | `''`                   | CLI flags to pass to `svelte-check`.                                                                      |
| dev.logLevel | `('error' \| 'warning')[]` | `['error', 'warning']` | **(Only in dev mode)** Which level of svelte-check diagnostics should be emitted to terminal and overlay. |
