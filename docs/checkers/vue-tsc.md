# vue-tsc (Vue Language Tools)

You can use vue-tsc checker for your Vue 3 project. If you're still using Vue2,
choose [VLS](/checkers/vls) checker.

## Installation

::: info Since `0.7.0`, `vue-tsc` requires at least >= `2.0.0`, with
typescript >= `5.0.0`. If you can't upgrade to the latest version, please use
`0.6.x` or below version. :::

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) &
   [typescript](https://www.npmjs.com/package/typescript) are installed as a
   peer dependency of your Vite project.

   ```bash
   pnpm add vue-tsc@latest typescript -D
   ```

2. Add `vueTsc` field to plugin config.

   ```js
   export default {
     plugins: [checker({ vueTsc: true /** or an object config */ })],
   }
   ```

## Configuration

Advanced object configuration table of `options.vueTsc`

| field        | Type      | Default value                                         | Description                                                                                                                                                                                                                         |
| :----------- | --------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root         | `string`  | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file                                                                                                                                                                                                     |
| tsconfigPath | `string`  | `"tsconfig.json"`                                     | Relative tsconfig path to `root`                                                                                                                                                                                                    |
| buildMode    | `boolean` | `false`                                               | Add [`--build`](https://www.typescriptlang.org/docs/handbook/project-references.html) to `vue-tsc` flag, note that `noEmit` does NOT work if `buildMode` is `true` ([#36917](https://github.com/microsoft/TypeScript/issues/36917)) |

3. **(optional for Vue2 project only)** The type check is powered by `vue-tsc`
   so it supports Vue2. According to the
   [documentation](https://github.com/vuejs/language-tools/blob/master/packages/vscode-vue/README.md#usage),
   you need to install `@vue/runtime-dom` for Vue version <= `2.6.14`.
