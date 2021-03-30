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
interface PluginOptions {
  /**
   * [WIP] Use `tsc` or `vue-tsc`
   * @default if vue-tsc is installed, then true, otherwise false
   */
  vueTsc: boolean
  /**
   * Show TypeScript error overlay
   * @default Same as Vite config - `server.hmr.overlay`
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
   * @default if `vueTsc` is true, then force set to 'cli', otherwise default to 'api'
   */
  mode: 'cli' | 'api'
  /**
   * Run in build mode ()
   * @default true
   */
  build: boolean | {}
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
- [ ] custom command
- [ ] custom tsconfig path
- [ ] no tsconfig file error
- [x] examples (codesandbox?)
- [ ] release stable version

## License

MIT
