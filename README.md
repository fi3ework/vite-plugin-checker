# vite-plugin-ts-checker

## Features

- ⚡️ Out of the box
- 💚 Support Vue by [vue-tsc](https://github.com/johnsoncodehk/vue-tsc) (only build mode for now)
- 🚥 Support overlay
- 🎳 Support dev & build mode

<p align="center">
  <img alt="screenshot" src="https://user-images.githubusercontent.com/12322740/113175704-48cf1e80-927e-11eb-9bb5-43ab1b218cb2.png">
</p>

## Usage

### Install

```bash
npm i vite-plugin-ts-checker -D

# yarn add vite-plugin-ts-checker -D
# pnpm i vite-plugin-ts-checker -D
```

### Add to `vite.config.js`

```ts
// vite.config.js
import TsChecker from 'vite-plugin-ts-checker'

export default {
  plugins: [TsChecker()],
  // or use config
  // plugins: [TsChecker({ ...options })], // see options
}
```

## Options

```ts
export interface PluginOptions {
  /**
   * Use `"tsc"` or `"vue-tsc"`
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

See [./examples](./examples) to have a try.

```bash
pnpm i
cd ./examples/<ONE_EXAMPLE>
npm run dev
```

### Roadmap

- [ ] project references
- [ ] vue-tsc to support watch mode

## License

MIT
