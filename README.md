# vite-plugin-checker

A Vite plugin that runs TypeScript, VLS, vue-tsc and other checkers in worker thread.

[![npm version](https://img.shields.io/npm/v/vite-plugin-checker)](https://www.npmjs.com/package/vite-plugin-checker) [![downloads/month](https://img.shields.io/npm/dm/vite-plugin-checker)](https://www.npmtrends.com/vite-plugin-checker) [![Unit Test](https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/fi3ework/vite-plugin-checker/branch/main/graph/badge.svg?token=YCU4HJ66RA)](https://codecov.io/gh/fi3ework/vite-plugin-checker)

## Features

- ⚡️ Speeds up TypeScirpt, VLS, etc. checkers by running in worker thread in serve mode
- 🌈 Works good with vanilla TypeScript, React, Vue2, Vue3
- ❄️ Prompt errors in Vite HMR overlay and terminal console
- 🌗 Support serve and build mode

<p align="center">
  <img alt="screenshot" src="https://user-images.githubusercontent.com/12322740/113175704-48cf1e80-927e-11eb-9bb5-43ab1b218cb2.png">
</p>

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
  plugins: [checker({ typescript: true })],
}
```

Open localhost page and start development (it's recommended to open browser for a better terminal display, see [#27](https://github.com/fi3ework/vite-plugin-checker/pull/27)).

## Configuration

> See detail options in [advanced config](#advanced-config) section.

### React / Vanilla TypeScript

1. Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency.

2. Add `typescript` field to plugin config.

```js
export default {
  plugins: [checker({ typescript: true } /** TS options */)],
}
```

### Vue (use Vetur / VLS)

1. Install `vite-plugin-checker-vls`. This package provides the essential dependencies that will be imported by VLS checker (`vls` filed).

```bash
yarn add vite-plugin-checker-vls -D
```

2. Add `vls` field to plugin config.

```js
import checker from 'vite-plugin-checker'

module.exports = {
  plugins: [checker({ vls: true })],
}
```

### Vue (use Volar / vue-tsc)

> Only support checking in **build mode** since `vue-tsc` doesn't support watch mode for now.

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) is installed as a peer dependency.

2. Add `vueTsc` field to plugin config.

3. (Optional) The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.

```js
export default {
  plugins: [checker({ vueTsc: true })],
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

| field   | Type      | Default value                                                         | Description                                   |
| :------ | --------- | --------------------------------------------------------------------- | --------------------------------------------- |
| overlay | `boolean` | Same as [`server.hmr.overlay`](https://vitejs.dev/config/#server-hmr) | Show Vite error overlay when there's an error |

### config.enableBuild

| field       | Type      | Default value | Description                   |
| :---------- | --------- | ------------- | ----------------------------- |
| enableBuild | `boolean` | `true`        | Enable checking in build mode |

---

**For config fields below:**

- Set to `true` to use checker with it's default values
- Leave the field blank or set to `false` to disable the checker
- Enable with an object advanced config (all keys are optional)

### config.typescript

| field        | Type     | Default value                                         | Description                      |
| :----------- | -------- | ----------------------------------------------------- | -------------------------------- |
| root         | `string` | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file  |
| tsconfigPath | `string` | `"tsconfig.json"`                                     | Relative tsconfig path to `root` |

### config.vls

_If `vls` filed is not falsy. `vite-plugin-checker-vls` **must** be installed as a peer dependency to provide VLS needed dependencies._

| field | Type     | Default value | Description |
| :---- | -------- | ------------- | ----------- |
| todo  | `string` | todo          | todo        |

e.g.

```js
import checker from 'vite-plugin-checker'

module.exports = {
  plugins: [
    checker({
      vls: {
        /** No options for now */
      },
    }),
  ],
}
```

<!-- | field | Type     | Default value                                         | Description              |
| :---- | -------- | ----------------------------------------------------- | ------------------------ |
| root  | `string` | [Vite config](https://vitejs.dev/config/#root) `root` | Root dir for checker run | -->

### config.vueTsc

- type: `boolean`

<!-- | field | Type     | Default value                                         | Description              |
| :---- | -------- | ----------------------------------------------------- | ------------------------ |
| root  | `string` | [Vite config](https://vitejs.dev/config/#root) `root` | Root dir for checker run | -->

## Playground

Run projects in [`playground/*`](./playground) to try it out.

```bash
pnpm i
npm run build
cd ./playground/<ONE_EXAMPLE>   # ts / vls / vue-tsc
npm run dev                     # test serve
npm run build                   # test build
```

## License

MIT License © 2021 [fi3ework](https://github.com/fi3ework)
