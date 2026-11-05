# Integration

## Overlay in development mode

The overlay runtime is loaded by the Vite client (`/@vite/client`). Any page that loads the Vite client in development shows the overlay, including pages rendered by a [traditional backend](https://vitejs.dev/guide/backend-integration.html#backend-integration) or by an SSR framework such as Nuxt, SvelteKit or TanStack Start.

### overlay does not display

If a page does not load the Vite client, inject vite-plugin-checker's runtime manually.

```html
<!-- if development -->
<script type="module" src="http://localhost:5173/@vite-plugin-checker-runtime-entry"></script>
```

## with Tailwind CSS

### reporting Tailwind CSS class issues

[eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss) reports conflicting, unknown, deprecated and non-canonical classes. It runs as an ESLint plugin or an oxlint JS plugin, so its diagnostics are shown by the [ESLint](/checkers/eslint) or [oxlint](/checkers/oxlint) checker.

1. Install and configure the plugin for your framework by following its [quick start](https://github.com/schoero/eslint-plugin-better-tailwindcss#quick-start).
2. Enable the checker for the linter you configured it with.

   ```ts
   import { defineConfig } from 'vite'
   import checker from 'vite-plugin-checker'

   export default defineConfig({
     plugins: [
       checker({
         eslint: {
           lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
         },
         // or
         oxlint: true,
       }),
     ],
   })
   ```

## with Nuxt

Add vite-plugin-checker to `vite.plugins` in `nuxt.config.ts`.

```ts
import { checker } from 'vite-plugin-checker'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    plugins: [
      checker({
        vueTsc: true,
      }),
    ],
  },
})
```

Alternatively, enable type checking as a built-in Nuxt feature. See the [typecheck section](https://nuxt.com/docs/api/commands/typecheck) of the Nuxt documentation.
