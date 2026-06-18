# Biome

## Installation

1. Make sure [@biomejs/biome](https://www.npmjs.com/package/@biomejs/biome) is installed as peer dependency.

2. Add `biome` field to plugin config. The exact command to be run can be further configured with `command` and `flags` parameters. See [the documentation](https://biomejs.dev/reference/cli/) for CLI reference. The default root of the command uses Vite's [root](https://vitejs.dev/config/#root).

   :::tip
   Do not add `--apply` to the flags since the plugin is only aiming at checking issues.
   :::

   ```js
   // e.g.
   export default {
     plugins: [
       checker({
         biome: {
           command: 'check',
         },
       }),
     ],
   }
   ```

## Configuration

Advanced object configuration table of `options.biome`

| field         | Type                                    | Default value                        | Description                                                                                                    |
| :------------ | --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| command       | `'check' \| 'lint' \| 'format' \| 'ci'` | `'lint'` in dev, `'check'` in build. | The command to execute biome with.                                                                             |
| flags         | `string`                                | `''`                                 | CLI flags to pass to the command.                                                                              |
| watchPath     | `string \| string[]`                    | `undefined`                          | **(Only in dev mode)** Configure path to watch files for Biome. If not specified, will watch the entire project root. |
| dev.logLevel  | `('error' \| 'warning')[]`              | `['error', 'warning']`               | **(Only in dev mode)** Which level of Biome diagnostics should be emitted to terminal and overlay in dev mode. |
| dev.command   | `'check' \| 'lint' \| 'format' \| 'ci'` | `''`                                 | Command to run in dev mode, it will override `command` config in dev mode.                                     |
| dev.flags     | `string`                                | `''`                                 | Flags to run in dev mode, it will override `flags` config in dev mode.                                         |
| build.command | `'check' \| 'lint' \| 'format' \| 'ci'` | `''`                                 | Command to run in build mode, it will override `command` config in build mode.                                 |
| build.flags   | `string`                                | `''`                                 | Flags to run in build mode, it will override `flags` config in build mode.                                     |
