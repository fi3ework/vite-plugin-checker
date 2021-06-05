# vite-plugin-ts-checker

A Vite plugin that runs TypeScript type checker.

## Features

- 📦 Out of the box
- 💚 Support Vue2/3 based on [vue-tsc](https://github.com/johnsoncodehk/vue-tsc) and [VLS](https://github.com/vuejs/vetur/blob/master/server/README.md)
- ⛔️ Vite HMR overlay
- 🛠 Support serve & build mode

<p align="center">
  <img alt="screenshot" src="https://user-images.githubusercontent.com/12322740/113175704-48cf1e80-927e-11eb-9bb5-43ab1b218cb2.png">
</p>

## Usage

### Install

#### Install plugin

```bash
npm i vite-plugin-ts-checker -D
```

### Config `vite.config.js`

Add `vite-plugin-ts-checker` to plugin filed of Vite config file.

```ts
// vite.config.js
import Checker from 'vite-plugin-ts-checker'

export default {
  plugins: [Checker()],
  // or with advanced options `plugins: [Checker({ ...options })]`
  // see options for detail
}
```

#### React

1. Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency.
2. Set `checker` to `"tsc"`.

```js
{
  checker: 'tsc'
  // ...
}
```

#### Vue (Vetur)

1. Install [VLS](https://www.npmjs.com/package/vls) checker preset.

```bash
npm i vite-plugin-ts-checker-preset-vls -D
```

2. Modify config file

```js
import Checker from 'vite-plugin-ts-checker'
import VlsChecker from 'vite-plugin-ts-checker-preset-vls'

module.exports = {
  plugins: [
    Checker({
      checker: VlsChecker(/** VLS options */),
    }),
  ],
}
```

#### Vue (Volar)

> Only support checking in **build mode** as `vue-tsc` doesn't support watch mode for now.

1. Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) is installed as a peer dependency, and set `checker` to `"vue-tsc"`.

2. The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.

```js
{
  checker: 'vue-tsc'
  // ...
}
```

## Advanced options interface

```ts
export interface PluginOptions {
  /**
   * Use `"tsc"` or `"vue-tsc"` or an custom checker
   * @defaultValue `"tcs"`
   */
  checker: 'tsc' | 'vue-tsc' | Checker
  /**
   * Enabled in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean
  /**
   * Show overlay when has TypeScript error
   * @defaultValue
   * Same as [Vite config](https://vitejs.dev/config/#root)
   */
  overlay: boolean
  /**
   * Root path to find tsconfig file
   * @defaultValue
   * Same as [Vite config](https://vitejs.dev/config/#root)
   */
  root: string
  /**
   * Relative tsconfig path to {@link (PluginOptions:interface).root}
   * @defaultValue `"tsconfig.json"`
   */
  tsconfigPath: string
}
```

## Examples

Run projects in [`examples/*`](./examples) to try it out.

```bash
pnpm i
cd ./examples/<ONE_EXAMPLE>
npm run dev
```

### Roadmap

- [x] Support [VLS](https://www.npmjs.com/package/vls)
- [ ] Development mode runs in separated process (or worker thread?)
- [ ] Add unit & e2e test
- [ ] Support project reference
- [ ] Wait for vue-tsc to support watch mode

## License

MIT
