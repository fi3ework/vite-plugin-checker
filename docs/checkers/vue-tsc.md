# vue-tsc (Volar)

You can use vue-tsc checker for your Vue3 project. If you're still using Vue2, choose [VLS](/checkers/vls) checker.

## Installation

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) & [typescript](https://www.npmjs.com/package/typescript) are installed as a peer dependency of your Vite project.

   ```bash
   pnpm add vue-tsc@latest typescript -D
   ```

   ::: tip
   The `vue-tsc` version **must** be >= `0.33.9`. `vue-tsc` has released a `1.0.0` version, it's recommended to try it out.
   :::

2. Add `vueTsc` field to plugin config.

   ```js
   export default {
     plugins: [checker({ vueTsc: true /** or an object config */ })],
   }
   ```

## Configuration

Advanced object configuration table of `options.vueTsc`

| field        | Type     | Default value                                         | Description                      |
| :----------- | -------- | ----------------------------------------------------- | -------------------------------- |
| root         | `string` | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file  |
| tsconfigPath | `string` | `"tsconfig.json"`                                     | Relative tsconfig path to `root` |

3. **(optional for Vue2 project only)** The type check is powered by `vue-tsc` so it supports Vue2. According to the [documentation](https://github.com/vuejs/language-tools/blob/master/packages/vscode-vue/README.md#usage), you need to install `@vue/runtime-dom` for Vue version <= `2.6.14`.
