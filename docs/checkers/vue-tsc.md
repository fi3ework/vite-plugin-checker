# vue-tsc (Volar)

You can use vue-tsc checker for your Vue3 project. If you're still using Vue2, choose [VLS](/checkers/vls) checker.

## Installation

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) & [typescript](https://www.npmjs.com/package/typescript) are installed as a peer dependency of your Vite project.

```bash
pnpm add vue-tsc@latest typescript -D
```

::: warning
The `vue-tsc` version **must** >= `0.33.9`.
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

3. (Optional for Vue2 user) The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.
