# oxlint

## Installation

1. Make sure [oxlint](https://www.npmjs.com/package/oxlint) is installed as a dependency.

2. Add `oxlint` field to plugin config. Valid options are either `true` or a configuration object.

   ```js
   // e.g.
   export default defineConfig({
     plugins: [
       checker({
         oxlint: true,
         // or
         oxlint: {
           lintCommand: "oxlint -D correctness",
         },
       }),
     ],
   });
   ```

### Hiding warnings

Add `--quiet` to `lintCommand` to report errors only. `lintCommand` is also used in dev mode, so to hide warnings in build mode only, set it based on the command:

```js
export default defineConfig(({ command }) => ({
  plugins: [
    checker({
      oxlint: {
        lintCommand: command === "build" ? "oxlint --quiet" : "oxlint",
      },
    }),
  ],
}));
```

## Configuration

Advanced object configuration table of `options.oxlint`

| field        | Type                       | Default value          | Description                                                                                                            |
| :----------- | -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| lintCommand  | `string`                   | `oxlint`               | `lintCommand` will be executed at build mode, and will also be used in dev mode.                                       |
| watchPath    | `string \| string[]`       | `undefined`            | **(Only in dev mode)** Configure path to watch files for oxlint. If not specified, will watch the entire project root. |
| dev.logLevel | `('error' \| 'warning')[]` | `['error', 'warning']` | **(Only in dev mode)** Which level of oxlint should be emitted to terminal and overlay in dev mode.                    |
