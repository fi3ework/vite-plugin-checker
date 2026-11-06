# Backend integration and SSR

The overlay loads through the Vite client (`/@vite/client`). Any page that loads the Vite client in dev mode shows the overlay, with no extra setup. This includes pages rendered by SSR frameworks such as Nuxt, SvelteKit, and TanStack Start, and pages served by a [backend integration](https://vite.dev/guide/backend-integration) that follows Vite's setup.

## Load the overlay without the Vite client

If a page doesn't load the Vite client, add the overlay runtime yourself. Include this script in development only, and replace the origin with your Vite dev server's:

```html
<script type="module" src="http://localhost:5173/@vite-plugin-checker-runtime-entry"></script>
```

If you set Vite's [`base`](https://vite.dev/config/shared-options#base), add it to the path, for example `http://localhost:5173/app/@vite-plugin-checker-runtime-entry`.

The overlay is added once per dev server, so it's safe to include this script on a page that also loads the Vite client.
