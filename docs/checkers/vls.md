# VLS

You can use VLS checker for your Vue2 project. If you're using Vue3, choose [vue-tsc](/checkers/vue-tsc) checker.

## Installation

1. Make sure [vls](https://www.npmjs.com/package/vls) and [vti](https://www.npmjs.com/package/vti) are installed as peer dependencies, plugin will use vls on dev mode and vti on build mode.

   ```bash
   pnpm add vls vti -D
   ```

2. Add `vls` field to plugin config.

   ```js
   module.exports = {
     plugins: [checker({ vls: true })],
   }
   ```

## Configuration

Advanced object configuration of `options.vls`

VLS configuration accepts the same values that can be configured in VS code with keys that start with `vetur`.
These are configured with nested objects rather than dotted string notation. TypeScript intellisense is available.

See [`initParams.ts`](https://github.com/fi3ework/vite-plugin-checker/blob/8fc5d7f4a908a4c80d1cb978e0acf1d4e5700e6a/packages/vite-plugin-checker/src/checkers/vls/initParams.ts#L33) for a comprehensive list of the defaults that can be overridden. Unfortunately, Vetur does not provide a single comprehensive document of all its options.

For example, to performing checking only the `<script>` block:

```ts
checker({
  vls: {
    vetur: {
      validation: {
        template: false,
        templateProps: false,
        interpolation: false,
        style: false,
      },
    },
  },
}),
```
