# vue-tsc

The vue-tsc checker reports type errors in Vue single-file components and `.ts` files, using [Vue Language Tools](https://github.com/vuejs/language-tools). Use it instead of the [TypeScript](/checkers/typescript) checker in Vue projects.

## Set up

1. Install `vue-tsc` and TypeScript. The checker supports `vue-tsc` `~2.2.10` and `^3.0.0`, with TypeScript 5 or later.

   ::: code-group

   ```bash [pnpm]
   pnpm add -D vue-tsc typescript
   ```

   ```bash [npm]
   npm install -D vue-tsc typescript
   ```

   ```bash [yarn]
   yarn add -D vue-tsc typescript
   ```

   ```bash [bun]
   bun add -d vue-tsc typescript
   ```

   :::

2. Enable the checker:

   ```ts
   import vue from '@vitejs/plugin-vue'
   import { defineConfig } from 'vite'
   import checker from 'vite-plugin-checker'

   export default defineConfig({
     plugins: [
       vue(),
       checker({
         vueTsc: true,
       }),
     ],
   })
   ```

In dev mode, the checker uses the TypeScript watch API with the Vue language plugin. In build mode, it runs `vue-tsc --noEmit`.

## Use a different tsconfig

By default, the checker looks for `tsconfig.json` in the Vite root. To use another file, set `tsconfigPath`:

```ts
checker({
  vueTsc: {
    tsconfigPath: 'tsconfig.app.json',
  },
})
```

## Project references

Build mode (`vue-tsc --build`) turns on automatically when the tsconfig is solution-style: `"files": []`, no `include`, and at least one entry in `references`. `create-vue` generates this layout. To turn it on or off explicitly, set `buildMode`. Build mode works the same way as in the [TypeScript checker](/checkers/typescript#project-references).

## Options

| Option         | Type      | Default                                                | Description                                                                  |
| -------------- | --------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `root`         | `string`  | [Shared `root`](/reference/shared-options#root)        | Directory to resolve `tsconfigPath` from.                                    |
| `tsconfigPath` | `string`  | `'tsconfig.json'`                                      | Path to the tsconfig file, relative to `root`.                               |
| `buildMode`    | `boolean` | `true` for solution-style tsconfigs, otherwise `false` | Run `vue-tsc` with `--build`. See [Project references](#project-references). |
