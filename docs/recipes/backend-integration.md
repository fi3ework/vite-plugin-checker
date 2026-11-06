# Backend integration and SSR

The overlay loads through the Vite client (`/@vite/client`). Any page that loads the Vite client in dev mode shows the badge and drawer, with no extra setup. This includes pages rendered by SSR frameworks such as Nuxt, SvelteKit, and TanStack Start, and pages served by a [backend integration](https://vite.dev/guide/backend-integration) that follows Vite's setup.

## Pages without the Vite client

If a page doesn't load the Vite client, load it yourself. Include this script in development only, and replace the origin with your Vite dev server's:

```html
<script type="module" src="http://localhost:5173/@vite/client"></script>
```

If you set Vite's [`base`](https://vite.dev/config/shared-options#base), add it to the path, for example `http://localhost:5173/app/@vite/client`.

The diagnostics page is also available at `http://localhost:5173/__checker/` without any change to the page.
