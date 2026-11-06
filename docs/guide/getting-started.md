# Getting started

This guide adds TypeScript type checking to an existing Vite project. The steps are the same for the other checkers; only the packages you install and the option you set change.

## Prerequisites

- A Vite project that meets the [requirements](/guide/introduction#requirements)
- A `tsconfig.json` in the project root

## Install and configure

1. Install vite-plugin-checker and TypeScript as dev dependencies:

   ::: code-group

   ```bash [pnpm]
   pnpm add -D vite-plugin-checker typescript
   ```

   ```bash [npm]
   npm install -D vite-plugin-checker typescript
   ```

   ```bash [yarn]
   yarn add -D vite-plugin-checker typescript
   ```

   ```bash [bun]
   bun add -d vite-plugin-checker typescript
   ```

   :::

2. Add the plugin to your Vite config and enable the `typescript` checker:

   ```ts
   // vite.config.ts
   import { defineConfig } from 'vite'
   import checker from 'vite-plugin-checker'

   export default defineConfig({
     plugins: [
       checker({
         typescript: true,
       }),
     ],
   })
   ```

   The plugin is also available as a named export, `import { checker } from 'vite-plugin-checker'`.

3. Start the dev server:

   ```bash
   npx vite
   ```

   Type errors appear in the terminal. Open the app in a browser to see them in the overlay as well.

4. Run a production build:

   ```bash
   npx vite build
   ```

   `tsc` runs alongside the build. If it reports an error, the build fails with `tsc`'s exit code.

## Enable more checkers

Set one option per checker. This example runs TypeScript and ESLint together:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
  ],
})
```

Some checkers accept `true`, and others need a configuration object. The [checkers overview](/checkers/overview) lists which is which.

## Next steps

- [Checkers overview](/checkers/overview): set up the checker that fits your project.
- [Dev and build modes](/guide/dev-and-build): learn how checks run and how they affect your build.
- [Vitest](/recipes/vitest): optional; skip the checkers when Vitest loads your Vite config.
