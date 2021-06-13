# vite-plugin-checker

A Vite plugin that runs TypeScript / Vue / ... checks in worker thread.

## Features

- 📦 Out of the box
- 🌗 Support React & Vue2/3
- 🕸 Vite HMR overlay
- 🛠 Support serve & build mode

<p align="center">
  <img alt="screenshot" src="https://user-images.githubusercontent.com/12322740/113175704-48cf1e80-927e-11eb-9bb5-43ab1b218cb2.png">
</p>

## Getting Started

### Install plugin

```bash
npm i vite-plugin-checker -D
```

### Config `vite.config.js`

Add `vite-plugin-checker` to plugin filed of Vite config file.

```ts
// vite.config.js
import Checker from 'vite-plugin-checker'

export default {
  plugins: [Checker({ typescript: true })],
}
```

## Framework configuration

> See detailed configuration in [advanced config](#advanced-config) section.

### React / Vanilla TypeScript

1. Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency.

2. Modify Vite config file.

```js
export default {
  plugins: [Checker({ typescript: true })],
}
```

### Vue (use Vetur / VLS)

1. Install [VLS](https://www.npmjs.com/package/vls) checker checker.

```bash
npm i vite-plugin-checker-vls -D
```

2. Modify Vite config file.

```js
import Checker from 'vite-plugin-checker'
import VlsChecker from 'vite-plugin-checker-vls'

module.exports = {
  plugins: [
    Checker({
      vls: VlsChecker(/** VLS options */),
    }),
  ],
}
```

### Vue (use Volar / vue-tsc)

> Only support checking in **build mode** since `vue-tsc` doesn't support watch mode for now.

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) is installed as a peer dependency.

2. The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.

```js
export default {
  plugins: [Checker({ vueTsc: true })],
}
```

## Advanced config

Plugin can accept an object configuration.

```js
export default {
  plugins: [Checker(config /** Object config below */)],
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

### config.typescript

- Set to `true` to use checker with all default values
- Leave the field blank or set to `false` to disable the checker
- Enable with an object config (all object keys are optional)

| field        | Type     | Default value                                         | Description                      |
| :----------- | -------- | ----------------------------------------------------- | -------------------------------- |
| root         | `string` | [Vite config](https://vitejs.dev/config/#root) `root` | Root path to find tsconfig file  |
| tsconfigPath | `string` | `"tsconfig.json"`                                     | Relative tsconfig path to `root` |

### config.vls

- type: `VlsChecker` instance.

e.g.

```js
import Checker from 'vite-plugin-checker'
import VlsChecker from 'vite-plugin-checker-vls'

module.exports = {
  plugins: [
    Checker({
      vls: VlsChecker(/** No options for now */),
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

## Examples

Run projects in [`examples/*`](./examples) to try it out.

```bash
pnpm i
cd ./examples/<ONE_EXAMPLE> # react / vls / vue-tsc
npm run dev                 # for development
npm run build               # for build
```

## License

MIT
