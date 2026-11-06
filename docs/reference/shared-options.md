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

Shows diagnostics in a browser overlay in dev mode. Set `false` to disable the overlay, or pass an object to customize it. For a guide with examples, see [Overlay and terminal](/guide/overlay).

### `overlay.initialIsOpen`

- **Type:** `boolean | 'error'`
- **Default:** `true`

Whether the panel opens when there are diagnostics. `true` opens it for errors and warnings, `'error'` opens it for errors only, and `false` starts with the panel collapsed to the badge.

### `overlay.position`

- **Type:** `'tl' | 'tr' | 'bl' | 'br'`
- **Default:** `'bl'`

The corner of the page the badge appears in: top left, top right, bottom left, or bottom right.

### `overlay.badgeStyle`

- **Type:** `string`

Inline CSS added to the badge, in the format of the [`style` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/style). For example, `'display: none;'` hides the badge.

### `overlay.panelStyle`

- **Type:** `string`

Inline CSS added to the diagnostics panel, in the format of the [`style` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/style).

### `overlay.editorUrl`

- **Type:** `(location: { file: string; line: number; column: number }) => string | undefined`

Builds the URL that opens when you click a file path in the overlay. `file` is the absolute path as the checker reports it, and `line` and `column` are 1-based. Return `undefined` to open the file with Vite's `/__open-in-editor` endpoint.

The function runs on the dev server. For an example that maps container paths to the host, see [Open files from the overlay](/guide/overlay#open-files-from-the-overlay).

## `terminal`

- **Type:** `boolean`
- **Default:** `true`

Prints diagnostics in the terminal that runs the dev server. Build mode output isn't affected; it always goes to the terminal.

## `enableBuild`

- **Type:** `boolean`
- **Default:** `true`

Runs the checkers during `vite build`. Set `false` to run them only in dev mode. See [Build mode](/guide/dev-and-build#build-mode).

## `root`

- **Type:** `string`
- **Default:** the Vite [`root`](https://vite.dev/config/shared-options#root)

The directory that checkers run from, in both dev and build mode. Relative paths in `lintCommand`, `flags`, and `watchPath` resolve against it. The TypeScript and vue-tsc checkers also accept their own [`root`](/checkers/typescript#options) option to find the tsconfig.
