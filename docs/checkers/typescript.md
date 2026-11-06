# TypeScript

The TypeScript checker reports type errors in `.ts` and `.tsx` files, using your project's `tsconfig.json`. Use it for vanilla TypeScript, React, and other projects without framework-specific files. For Vue, use [vue-tsc](/checkers/vue-tsc); for Svelte, use [svelte-check](/checkers/svelte-check).

## Set up

1. Install TypeScript:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D typescript
   ```

   ```bash [npm]
   npm install -D typescript
   ```

   ```bash [yarn]
   yarn add -D typescript
   ```

   ```bash [bun]
   bun add -d typescript
   ```

   :::

2. Enable the checker:

   ```ts
   checker({
     typescript: true,
   })
   ```

In dev mode, the checker uses the TypeScript watch API with `noEmit`. In build mode, it runs `tsc --noEmit`.

## Use a different tsconfig

By default, the checker looks for `tsconfig.json` in the Vite root. To use another file, set `tsconfigPath`:

```ts
checker({
  typescript: {
    tsconfigPath: 'tsconfig.app.json',
  },
})
```

## Project references

If your tsconfig uses [project references](https://www.typescriptlang.org/docs/handbook/project-references.html), the checker can run in build mode (`tsc --build`), which checks every referenced project.

Build mode turns on automatically when the tsconfig is solution-style: `"files": []`, no `include`, and at least one entry in `references`. The `react-ts` template of `create-vite` generates this layout. To turn it on or off explicitly, set `buildMode`:

```ts
checker({
  typescript: {
    buildMode: true,
  },
})
```

`--build` doesn't accept `--noEmit` ([TypeScript#36917](https://github.com/microsoft/TypeScript/issues/36917)), so `tsc` follows the emit settings of each referenced project. Set `"noEmit": true` in referenced projects that shouldn't write output, as the `create-vite` templates do.

## TypeScript 7

The checker has experimental support for TypeScript 7 (the native Go port). When the installed `typescript` package is version 7, dev mode runs `tsc --watch` as a child process instead of using the watch API.

## Options

| Option           | Type      | Default                                                | Description                                                                                                                                          |
| ---------------- | --------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`           | `string`  | [Shared `root`](/reference/shared-options#root)        | Directory to resolve `tsconfigPath` from.                                                                                                            |
| `tsconfigPath`   | `string`  | `'tsconfig.json'`                                      | Path to the tsconfig file, relative to `root`.                                                                                                       |
| `buildMode`      | `boolean` | `true` for solution-style tsconfigs, otherwise `false` | Run `tsc` with `--build`. See [Project references](#project-references).                                                                             |
| `typescriptPath` | `string`  | `'typescript'`                                         | Module specifier or absolute path of the `typescript` package to use in dev mode. Build mode always runs the `tsc` binary installed in your project. |
