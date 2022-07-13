# Getting Started

1. Install plugin.

   ```bash
   pnpm add vite-plugin-checker -D
   ```

   If you are using Yarn or NPM

   ```bash
   yarn add vite-plugin-checker -D
   npm i vite-plugin-checker -D
   ```

::: warning
If you are using [Vite 3](https://vitejs.dev/blog/announcing-vite3.html), the minimum version of `vite-plugin-checker` must be `^0.4.9`. See more at [#153](https://github.com/fi3ework/vite-plugin-checker/pull/153).
:::

2. Add plugin to Vite config file. Add the checker you need. We add TypeScript below as an example. See all available checkers [here](/checkers/overview).

   ```ts
   // vite.config.js
   import checker from 'vite-plugin-checker'
   export default {
     plugins: [checker({ typescript: true })], // e.g. use TypeScript check
   }
   ```

3. You're all set. Open localhost page and start development 🚀.

::: tip
It's recommended to open a browser for a better terminal flush, see [#27](https://github.com/fi3ework/vite-plugin-checker/pull/27).
:::

::: warning
`server.ws.on` is introduced to Vite in [2.6.8](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#268-2021-10-18). vite-plugin-checker relies on `server.ws.on` to bring diagnostics back after a full reload and it' not available for older version of Vite.
:::
