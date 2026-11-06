# Overlay and terminal

In dev mode, vite-plugin-checker reports diagnostics in two places: the terminal that runs the dev server, and an overlay in the browser. This page shows how to customize both. For the full option types, see [Shared options](/reference/shared-options).

## Browser overlay

The overlay appears when any checker reports a diagnostic. It has two parts:

- **The panel** lists each diagnostic with its message, a code frame, the file location, and the rule that reported it.
- **The badge** sits in a corner of the page and shows the number of errors and warnings. Click it to open or close the panel.

The overlay is loaded by the Vite client, so it works on any page that loads `/@vite/client`, including pages rendered by SSR frameworks. If your page doesn't load the Vite client, see [Backend integration and SSR](/recipes/backend-integration).

### Choose when the panel opens

By default, the panel opens whenever there are diagnostics. Use `overlay.initialIsOpen` to change this:

```ts
checker({
  overlay: {
    // Open only for errors; warnings only update the badge.
    initialIsOpen: 'error',
  },
  typescript: true,
})
```

| Value              | Behavior                                     |
| ------------------ | -------------------------------------------- |
| `true` _(default)_ | Opens when there are errors or warnings      |
| `'error'`          | Opens when there are errors                  |
| `false`            | Starts collapsed; click the badge to open it |

### Move or restyle the badge

Use `overlay.position` to move the badge to another corner: `'tl'` (top left), `'tr'` (top right), `'bl'` (bottom left, the default), or `'br'` (bottom right).

`overlay.badgeStyle` and `overlay.panelStyle` add inline CSS to the badge and the panel:

```ts
checker({
  overlay: {
    position: 'tr',
    badgeStyle: 'font-size: 12px;',
    panelStyle: 'opacity: 0.9;',
  },
  typescript: true,
})
```

To hide the badge but keep the panel, set `badgeStyle: 'display: none;'`.

### Open files from the overlay

Click a file path in the panel to open the file at the reported line and column. By default, this uses Vite's `/__open-in-editor` endpoint, which launches an editor on the machine that runs the dev server. To choose the editor, set the `LAUNCH_EDITOR` environment variable; see [launch-editor](https://github.com/yyx990803/launch-editor#supported-editors) for supported values.

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

Set `overlay: false` to report only in the terminal. The overlay runtime isn't loaded at all.

## Terminal output

Each checker prints its diagnostics and a summary line to the terminal that runs the dev server. File paths are relative to the current working directory. In [terminals that support hyperlinks](https://github.com/danielroe/clickable-path#terminal-support), they link to the file.

Set `terminal: false` to report only in the overlay.

## Next steps

- [Shared options](/reference/shared-options): see the types and defaults for every overlay option.
- [Backend integration and SSR](/recipes/backend-integration): load the overlay on pages that don't use the Vite client.
