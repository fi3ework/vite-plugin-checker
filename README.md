# vite-plugin-ts-checker

## **⚠ This project is still WIP, will be released recently**

Vite plugin that runs TypeScript type checker on a separate process.

## Features

- ⚡️ Out of the box
- 💚 Support Vue by [vue-tsc](https://github.com/johnsoncodehk/vue-tsc)
- 🚥 Support overlay
- 🎳 Support dev & build mode

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
   * [WIP]
   * 'cli': use `tsc --noEmit` or `vue-tsc --noEmit`
   *  - No overlay support
   *  - Original console output
   *
   * 'api': use TypeScript programmatic API
   *  - Support overlay
   *  - Almost the same console output as original
   *
   * @defaultValue
   * if 'vueTsc' is true, then force set to 'cli', otherwise default to 'api'
   */
  mode: 'cli' | 'api'
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

- [x] release alpha version
- [x] support build mode
- [x] custom tsconfig path
- [x] no tsconfig file error
- [x] examples
- [ ] custom command
- [ ] project references
- [ ] release stable version

## License

MIT
