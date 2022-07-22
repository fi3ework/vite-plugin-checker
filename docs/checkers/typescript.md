# TypeScript

You can use TypeScript checker for vanilla TypeScript project or React project.

## Installation

1. Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency.

2. Add `typescript` field to plugin config.

```js
export default {
  plugins: [checker({ typescript: true /** or an object config */ })],
}
```

## Configuration

Advanced object configuration table of `options.typescript`.

| field        | Type      | Default value                                         | Description                                                                                                                                                                                                                     |
| :----------- | --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root         | `string`  | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file                                                                                                                                                                                                 |
| tsconfigPath | `string`  | `"tsconfig.json"`                                     | Relative tsconfig path to `root`                                                                                                                                                                                                |
| buildMode    | `boolean` | `false`                                               | Add [`--build`](https://www.typescriptlang.org/docs/handbook/project-references.html) to `tsc` flag, note that `noEmit` does NOT work if `buildMode` is `true` ([#36917](https://github.com/microsoft/TypeScript/issues/36917)) |
