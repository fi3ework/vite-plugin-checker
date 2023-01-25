# Getting Started

1. Install plugin (pnpm recommended 🚀).

   ```bash
   pnpm add vite-plugin-checker -D
   ```

   If you are using Yarn or NPM

   ```bash
   yarn add vite-plugin-checker -D
   npm i vite-plugin-checker -D
   ```

2. Add plugin to Vite config file and config the checker you need. We add TypeScript here as an example. See all available checkers [here](/checkers/overview).

   ```ts
   // vite.config.js
   import checker from 'vite-plugin-checker'
   export default {
     plugins: [
       checker({
         // e.g. use TypeScript check
         typescript: true,
       }),
     ],
   }
   ```

::: tip
If you'd prefer to not run the checkers during unit testing with Vitest, you can alter the config based on that. Example:

```ts
// vite.config.js
import checker from 'vite-plugin-checker'
export default {
  plugins: [!process.env.VITEST ? checker({ typescript: true }) : undefined],
}
```

:::

3. You're all set. Open localhost page and start development 🚀.

::: tip
It's recommended to open a browser for a better terminal flush, see [#27](https://github.com/fi3ework/vite-plugin-checker/pull/27).
:::

::: warning
`server.ws.on` is introduced to Vite in [2.6.8](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#268-2021-10-18). vite-plugin-checker relies on `server.ws.on` to make overlay visible after opening a new browser tab.
:::
