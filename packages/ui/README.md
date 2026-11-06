# @vite-plugin-checker/ui

Browser code for vite-plugin-checker, bundled into the plugin and not published on its own:

- the diagnostics page served at `{base}__checker/` in dev, built into `../vite-plugin-checker/dist/@ui`
- the in-page badge and drawer, built into `../vite-plugin-checker/dist/@runtime/main.js`

```bash
pnpm build
pnpm dev # rebuild on change
```
