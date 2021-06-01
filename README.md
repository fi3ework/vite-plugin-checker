# vite-plugin-ts-checker

Vite plugin that runs TypeScript type checker on a separate process.

## Features

- ⚡️ Out of the box
- 💚 Support Vue2/3 based on [vue-tsc](https://github.com/johnsoncodehk/vue-tsc) and [VLS](https://github.com/vuejs/vetur/blob/master/server/README.md)
- 🚥 Vite HMR overlay
- 🛠 Serve & build mode

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

Add `vite-plugin-ts-checker` to plugin filed of Vite config:

```ts
// vite.config.js
import TsChecker from 'vite-plugin-ts-checker'

export default {
  plugins: [TsChecker()],
  // or with advanced options, see options for detail
  // plugins: [TsChecker({ ...options })]
}
```

#### React

Make sure [typescript](https://www.npmjs.com/package/typescript) is installed as a peer dependency, and set `checker` to `'tsc'`.

```js
{
  checker: 'tsc'
  // ...
}
```

#### Vue (Volar)

> Only support check in build mode as `vue-tsc` doesn't support watch mode for now.

Make sure [vue-tsc](https://www.npmjs.com/package/vue-tsc) is installed as a peer dependency, and set `checker` to `'vue-tsc'`.

The type check is powered by `vue-tsc` so it supports Vue2 according to the [documentation](https://github.com/johnsoncodehk/volar#using), you need to install `@vue/runtime-dom` by yourself.

```js
{
  checker: 'vue-tsc'
  // ...
}
```

#### Vue (Vetur)

Install check preset based on [VLS](https://www.npmjs.com/package/vls).

```bash
npm i vite-plugin-ts-checker-preset-vls -D
```

config file:

```js
import TsChecker from 'vite-plugin-ts-checker'
import vlsChecker from 'vite-plugin-ts-checker-preset-vls'

module.exports = {
  plugins: [
    TsChecker({
      checker: vlsChecker(/** VLS options */),
    }),
  ],
}
```

## Options interface

```ts
export interface PluginOptions {
  /**
   * Use `"tsc"` or `"vue-tsc"` or Checker
   * @defaultValue `"tcs"`
   */
  checker: 'tsc' | 'vue-tsc'
  /**
   * Throw in build mode if has error
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
   * Same as Vite https://vitejs.dev/config/#root
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

- [ ] Support Vue2 by [VLS](https://www.npmjs.com/package/vls) (WIP)
- [ ] Support project reference
- [ ] Wait for vue-tsc to support watch mode

## License

MIT
