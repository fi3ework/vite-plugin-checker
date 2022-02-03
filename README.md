# vite-plugin-checker

A Vite plugin that can run TypeScript, VLS, vue-tsc, ESLint in worker thread.

[![npm version](https://img.shields.io/npm/v/vite-plugin-checker)](https://www.npmjs.com/package/vite-plugin-checker) [![downloads/month](https://img.shields.io/npm/dm/vite-plugin-checker)](https://www.npmtrends.com/vite-plugin-checker) [![Unit Test](https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/fi3ework/vite-plugin-checker/branch/main/graph/badge.svg?token=YCU4HJ66RA)](https://codecov.io/gh/fi3ework/vite-plugin-checker)

## Features

- ⚡️ Speeds up TypeScript, VLS, etc. checkers by running in worker thread in serve mode
- 🌈 Works good with vanilla JS / TS, React, Vue2, Vue3
- ❄️ Prompt errors in Vite HMR overlay and terminal console
- 🌗 Support both serve and build mode

<p align="center">
  <img alt="screenshot" src="https://user-images.githubusercontent.com/12322740/126038209-81901247-86f1-4129-86c6-e1f8a13417e7.png">
</p>

> History version documentations [0.1](https://github.com/fi3ework/vite-plugin-checker/tree/v0.1.x) | [0.2](https://github.com/fi3ework/vite-plugin-checker/tree/v0.2)

## Getting Started

Install plugin.

```bash
yarn add vite-plugin-checker -D
```

Add it to Vite config file.

```ts
// vite.config.js
import checker from 'vite-plugin-checker'

export default {
  plugins: [checker({ typescript: true })], // e.g. use TypeScript check
}
```

Open localhost page and start development 🚀.

_It's recommended to open browser for a better terminal display, see [#27](https://github.com/fi3ework/vite-plugin-checker/pull/27)._

## Configuration

Detailed configuration is in [advanced config](#advanced-config) section.

### React / Vanilla TypeScript

1. Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency.

2. Add `typescript` field to plugin config.

```js
export default {
  plugins: [checker({ typescript: true } /** TS options */)],
}
```

### Vue (use Vetur / VLS)

1. Make sure [vls](https://www.npmjs.com/package/vls) is installed as a peer dependency, plugin will use vls as the check server.

```bash
yarn add vls -D
```

2. Add `vls` field to plugin config.

```js
module.exports = {
  plugins: [checker({ vls: true })],
}
```

### Vue (use Volar / vue-tsc)

_Only support checking in **build mode** since `vue-tsc` doesn't support watch mode for now._

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) is installed as a peer dependency.

2. Add `vueTsc` field to plugin config.

3. (Optional) The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.

```js
export default {
  plugins: [checker({ vueTsc: true })],
}
```

### ESLint

1. Make sure [eslint](https://www.npmjs.com/package/eslint) is installed as a peer dependency.

2. Add `eslint` field to plugin config.

```js
export default {
  plugins: [
    checker({
      eslint: {
        files: ['./src'],
        extensions: ['.ts'],
      },
    }),
  ],
}
```

## Advanced config

Plugin can accept an object configuration.

```js
export default {
  plugins: [checker(config /** Object config below */)],
}
```

### config.overlay

| field   | Type      | Default value | Description               |
| :------ | --------- | ------------- | ------------------------- |
| overlay | `boolean` | true          | Show error prompt overlay |

### config.enableBuild

| field       | Type      | Default value | Description                   |
| :---------- | --------- | ------------- | ----------------------------- |
| enableBuild | `boolean` | `true`        | Enable checking in build mode |

---

**For each checker config fields below:**

- If the filed is not falsy. The corresponding checker server should be installed as a peer dependency.
- Set to `true` to use checker with it's default values
- Leave the field blank or a falsy value to disable the checker
- Enable with an object advanced config

### config.typescript

| field        | Type      | Default value                                         | Description                                                                                                                                                                                                                     |
| :----------- | --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root         | `string`  | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file                                                                                                                                                                                                 |
| tsconfigPath | `string`  | `"tsconfig.json"`                                     | Relative tsconfig path to `root`                                                                                                                                                                                                |
| buildMode    | `boolean` | `false`                                               | Add [`--build`](https://www.typescriptlang.org/docs/handbook/project-references.html) to `tsc` flag, note that `noEmit` does NOT work if `buildMode` is `true` ([#36917](https://github.com/microsoft/TypeScript/issues/36917)) |

### config.vls

VLS configuration accepts the same values that can be configured in VS code with keys that start with `vetur`.
These are configured with nested objects rather than dotted string notation. TypeScript intellisense is available.

See [`initParams.ts`](https://github.com/fi3ework/vite-plugin-checker/blob/8fc5d7f4a908a4c80d1cb978e0acf1d4e5700e6a/packages/vite-plugin-checker/src/checkers/vls/initParams.ts#L33) for a comprehensive list of the defaults that can be overridden. Vetur unfortunately does not provide a single comprehensive document of all its options.

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

### config.vueTsc

_coming soon._

| field | Type | Default value | Description |
| :---- | ---- | ------------- | ----------- |
|       |      |               |             |

### config.eslint

| field                | Type                                                                                                       | Default value          | Description                                                                                                                                                                                              |
| :------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lintCommand          | `string`                                                                                                   | This value is required | `lintCommand` will be executed at build mode, and will also be used as default config for dev mode when `eslint.dev.eslint` is nullable.                                                                 |
| `dev.overrideConfig` | [`ESLint.Options`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/eslint/index.d.ts) | `undefined`            | **(Only in dev mode)** You can override the options of the translated from `lintCommand`. Config priority: `const eslint = new ESLint({cwd: root, ...translatedOptions, ...pluginConfig.eslint.dev, })`. |
| dev.logLevel         | `('error' \| 'warning')[]`                                                                                 | `['error', 'warning']` | **(Only in dev mode)** Which level of ESLint should be emitted to terminal and overlay in dev mode                                                                                                       |

## Playground

Run projects in [`playground/*`](./playground) to try it out.

```bash
pnpm i
npm run build
cd ./playground/<ONE_EXAMPLE>   # ts / vls / vue-tsc / vanilla ts
npm run dev                     # test serve
npm run build                   # test build
```

## License

MIT License © 2021 [fi3ework](https://github.com/fi3ework)
