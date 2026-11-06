# Overlay and terminal

In dev mode, vite-plugin-checker reports diagnostics in three places: the terminal that runs the dev server, a diagnostics page served by the dev server, and a badge in the browser that opens that page in a drawer. This page shows how to customize them. For the full option types, see [Shared options](/reference/shared-options).

## Diagnostics page

The dev server serves a diagnostics page at `{base}__checker/`, for example `http://localhost:5173/__checker/`. It lists the problems from every checker, grouped by file or by checker, and updates as you edit. Use it on its own in a second tab or window, or through the badge.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/screenshots/diagnostics-page-dark.png">
    <img alt="The vite-plugin-checker diagnostics page listing TypeScript and ESLint problems grouped by file" src="/screenshots/diagnostics-page-light.png">
  </picture>
</p>

## Browser overlay

Pages loaded from the dev server show a badge in a corner with the error and warning counts, and a spinner while the first check is still running. Clicking it opens the diagnostics page in a drawer along the same edge of the window. Press <kbd>Escape</kbd> to close the drawer, and drag its edge to resize it.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/screenshots/overlay-drawer-dark.png">
    <img alt="The vite-plugin-checker drawer open along the bottom of an app page" src="/screenshots/overlay-drawer-light.png">
  </picture>
</p>

The overlay is loaded by the Vite client, so it works on any page that loads `/@vite/client`, including pages rendered by SSR frameworks. If your page doesn't load the Vite client, see [Backend integration and SSR](/recipes/backend-integration).

### Choose when the drawer opens

By default, the drawer opens whenever there are diagnostics. Use `overlay.initialIsOpen` to change this:

```ts
checker({
  overlay: {
    // Open only for errors; warnings only update the badge.
    initialIsOpen: 'error',
  },
  typescript: true,
})
```

| Value              | Behavior                                  |
| ------------------ | ----------------------------------------- |
| `true` _(default)_ | Opens when there are errors or warnings   |
| `'error'`          | Opens when there are errors               |
| `false`            | Starts closed; click the badge to open it |

### Move or restyle the badge

Use `overlay.position` to move the badge to another corner: `'tl'` (top left), `'tr'` (top right), `'bl'` (bottom left, the default), or `'br'` (bottom right). The drawer opens along the same edge.

The overlay is a `<vite-plugin-checker-overlay>` element. Restyle it with `--mb-*` custom properties, or with `::part(badge)` and `::part(drawer)`:

```css
vite-plugin-checker-overlay {
  --mb-bg: #101418;
  --mb-fg: #f0f3f6;
  --mb-accent: #ff9e64;
  --mb-radius: 4px;
}

vite-plugin-checker-overlay::part(badge) {
  opacity: 0.8;
}
```

To hide the badge and the drawer but keep the diagnostics page, set `overlay.badge` to `false`.

### Open files from the overlay

Click a file path to open the file at the reported line and column. By default, this uses Vite's `/__open-in-editor` endpoint, which launches an editor on the machine that runs the dev server. To choose the editor, set the `LAUNCH_EDITOR` environment variable; see [launch-editor](https://github.com/yyx990803/launch-editor#supported-editors) for supported values.

When the dev server runs somewhere else, such as a container or a remote machine, the editor can't be launched that way. Set `overlay.editorUrl` to build a URL that your browser opens instead. This example maps a container path to the host and opens VS Code:

```ts
checker({
  overlay: {
    editorUrl: ({ file, line, column }) =>
      `vscode://file${file.replace('/app', '/Users/me/project')}:${line}:${column}`,
  },
  typescript: true,
})
```

`editorUrl` runs on the dev server. It receives the absolute file path as the checker reports it, and 1-based `line` and `column` numbers. Return `undefined` to fall back to `/__open-in-editor` for that file.

### Disable the overlay

Set `overlay: false` to report only in the terminal. Nothing is added to your pages; the diagnostics page stays available at `{base}__checker/`.

## Terminal output

Each checker prints its diagnostics and a summary line to the terminal that runs the dev server. File paths are relative to the current working directory. In [terminals that support hyperlinks](https://github.com/danielroe/clickable-path#terminal-support), they link to the file.

Set `terminal: false` to report only in the browser.

## Next steps

- [Shared options](/reference/shared-options): see the types and defaults for every overlay option.
- [Backend integration and SSR](/recipes/backend-integration): load the overlay on pages that don't use the Vite client.
