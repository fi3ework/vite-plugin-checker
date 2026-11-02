# Configurations

Shared configuration to control the checker behaviors of the plugin.

```ts
{
  /**
   * Show overlay on UI view when there are errors or warnings in dev mode.
   * - Set `true` to show overlay
   * - Set `false` to disable overlay
   * - Set with a object to customize overlay
   *
   * @defaultValue `true`
   */
  overlay:
    | boolean
    | {
        /**
         * Whether to default the overlay to being open
         * - Set `true` to initially open if errors/warnings are found
         * - Set `error` to initially open if errors are found
         * - Set `false` to initially collapse
         * @defaultValue `true`
         */
        initialIsOpen?: boolean | 'error'
        /**
         * The position of the vite-plugin-checker badge to open and close
         * the diagnostics panel
         * @default `bl`
         */
        position?: 'tl' | 'tr' | 'bl' | 'br'
        /**
         * Use this to add extra style string to the badge button, the string format is
         * [HTML element's style property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)
         * For example, if you want to hide the badge,
         * you can pass `display: none;` to the badgeStyle property
         * @default no default value
         */
        badgeStyle?: string
        /**
         * Use this to add extra style string to the diagnostic panel, the string format is
         * [HTML element's style property:](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)
         * For example, if you want to change the opacity of the panel,
         * you can pass `opacity: 0.8;` to the panelStyle property
         * @default no default value
         */
        panelStyle?: string
        /**
         * Build the URL opened when a file path is clicked in the overlay, such as
         * `vscode://file/...`. Return `undefined` to open the file with Vite's
         * `/__open-in-editor` endpoint instead.
         *
         * Called on the dev server, so it can map paths from a container to the host.
         * @default no default value
         */
        editorUrl?: (location: {
          file: string
          line: number
          column: number
        }) => string | undefined
      }
  /**
   * stdout in terminal which starts the Vite server in dev mode.
   * - Set `true` to enable
   * - Set `false` to disable
   *
   * @defaultValue `true`
   */
  terminal: boolean
  /**
   * Enable checking in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean

  /**
   * Configure root directory of checkers
   * @defaultValue no default value
   */
  root?: boolean;
}
```

## Opening files from the overlay

Clicking a file path in the overlay opens it through Vite's `/__open-in-editor` endpoint, which launches the editor on the machine running the dev server. When the dev server runs in a container, set `overlay.editorUrl` to open the file through a URL handler on the host instead, mapping the container path to the host path:

```ts
checker({
  overlay: {
    editorUrl: ({ file, line, column }) =>
      `vscode://file${file.replace('/app', '/Users/me/project')}:${line}:${column}`,
  },
})
```

In the terminal, file paths are printed relative to the current working directory, and link to the file in [terminals that support hyperlinks](https://github.com/danielroe/clickable-path#terminal-support).
