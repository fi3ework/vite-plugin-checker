# Shared options

These options apply to all checkers. Pass them to `checker()` alongside the checker options:

```ts
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      overlay: { initialIsOpen: 'error' },
      terminal: true,
      enableBuild: true,
      typescript: true,
    }),
  ],
})
```

For the options of each checker, see the [checker pages](/checkers/overview).

## `overlay`

- **Type:** `boolean | OverlayOptions`
- **Default:** `true`

Shows diagnostics in the browser in dev mode: a badge on every page that opens the diagnostics page in a drawer. Set `false` to add nothing to your pages, or pass an object to customize the overlay. For a guide with examples, see [Overlay and terminal](/guide/overlay).

### `overlay.initialIsOpen`

- **Type:** `boolean | 'error'`
- **Default:** `true`

Whether the drawer opens when there are diagnostics. `true` opens it for errors and warnings, `'error'` opens it for errors only, and `false` starts with the drawer closed.

### `overlay.badge`

- **Type:** `boolean | 'auto'`
- **Default:** `'auto'`

Whether to show the badge. `'auto'` hides it while an integration such as Nuxt shows the diagnostics in its own indicator. `false` adds nothing to your pages; the diagnostics page stays available.

### `overlay.position`

- **Type:** `'tl' | 'tr' | 'bl' | 'br'`
- **Default:** `'bl'`, or `'br'` when the Vite DevTools dock is shown

The corner of the page the badge appears in: top left, top right, bottom left, or bottom right. The drawer opens along the same edge. To restyle the badge or the drawer, see [Move or restyle the badge](/guide/overlay#move-or-restyle-the-badge).

### `overlay.devtools`

- **Type:** `boolean`
- **Default:** `true`

Adds a Checker panel and per-checker messages to [Vite DevTools](https://devtools.vite.dev) when it is installed. See [Vite DevTools](/guide/overlay#vite-devtools).

### `overlay.editorUrl`

- **Type:** `(location: { file: string; line: number; column: number }) => string | undefined`

Builds the URL that opens when you click a file path on the diagnostics page. `file` is the absolute path as the checker reports it, and `line` and `column` are 1-based. Return `undefined` to open the file with Vite's `/__open-in-editor` endpoint.

The function runs on the dev server. For an example that maps container paths to the host, see [Open files from the overlay](/guide/overlay#open-files-from-the-overlay).

## `terminal`

- **Type:** `boolean`
- **Default:** `true`

Prints diagnostics in the terminal that runs the dev server. Build mode output isn't affected; it always goes to the terminal. Set `false` to report only in the browser.

## `enableBuild`

- **Type:** `boolean`
- **Default:** `true`

Runs the checkers during `vite build`. Set `false` to run them only in dev mode. See [Build mode](/guide/dev-and-build#build-mode).

## `root`

- **Type:** `string`
- **Default:** the Vite [`root`](https://vite.dev/config/shared-options#root)

The directory that checkers run from, in both dev and build mode. Relative paths in `lintCommand`, `flags`, and `watchPath` resolve against it. The TypeScript and vue-tsc checkers also accept their own [`root`](/checkers/typescript#options) option to find the tsconfig.
