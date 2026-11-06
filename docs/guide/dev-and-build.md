# Dev and build modes

vite-plugin-checker behaves differently in `vite` (dev) and `vite build`. In dev mode it watches your files and reports as you work. In build mode it runs each checker's CLI once and fails the build if a check fails. This page describes both, so you can predict what each command does in your project.

## Dev mode

When the dev server starts, each enabled checker starts in its own worker thread. Checks run in parallel with Vite and don't delay transforms or HMR.

How each checker watches for changes:

| Checker      | Dev mode engine                                   | On file change                                                                          |
| ------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| TypeScript   | TypeScript watch API                              | Incremental re-check                                                                    |
| vue-tsc      | TypeScript watch API with the Vue language plugin | Incremental re-check                                                                    |
| svelte-check | `svelte-check --watch`                            | Incremental re-check                                                                    |
| ESLint       | ESLint Node.js API                                | Re-lints the changed files                                                              |
| Stylelint    | Stylelint Node.js API                             | Re-lints the changed files                                                              |
| Biome        | `biome` CLI                                       | Re-lints the changed files, or the whole project when `biome.json` changes              |
| oxlint       | `oxlint` CLI                                      | Re-lints the whole project, so cross-file rules such as `import/no-cycle` stay accurate |

The lint checkers (ESLint, Stylelint, Biome, and oxlint) share these behaviors:

- **Watched paths:** they watch the Vite root, or the paths in `watchPath`. `node_modules` and `.git` are never watched.
- **Debouncing:** changes within `dev.debounceMs` (300 ms by default) are linted in a single run.
- **Polling:** they use Vite's [`server.watch`](https://vite.dev/config/server-options#server-watch) polling options (`usePolling`, `interval`, and `binaryInterval`), so they work in the same environments as Vite's own watcher, such as Docker or WSL.

Each checker reports to the terminal and the browser overlay. To control where results appear, see [Overlay and terminal](/guide/overlay).

The workers stop when the dev server closes, and restart when the dev server restarts.

## Build mode

During `vite build`, vite-plugin-checker runs each enabled checker's CLI as a separate process, in parallel with bundling:

| Checker      | Command run in build mode                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| TypeScript   | `tsc --noEmit`, or `tsc --build` in [build mode](/checkers/typescript#project-references) |
| vue-tsc      | `vue-tsc --noEmit`, or `vue-tsc --build`                                                  |
| svelte-check | `svelte-check` with `flags`                                                               |
| ESLint       | `lintCommand`                                                                             |
| Stylelint    | `lintCommand`                                                                             |
| Biome        | `biome check`, or the configured command and flags                                        |
| oxlint       | `lintCommand`, or `oxlint`                                                                |

Commands run from the Vite root, or from [`root`](/reference/shared-options#root) if you set it. They run without a shell, so shell syntax such as `&&`, pipes, and environment variable expansion isn't available. Quote globs so they reach the linter as one argument; ESLint and Stylelint expand them themselves.

The CLI output goes straight to the terminal. If any checker exits with a non-zero code, vite-plugin-checker exits the Vite process with that code, so CI marks the build as failed.

A few consequences of using the CLI exit code:

- **Warnings don't fail the build** unless the linter is configured to exit with an error for them, for example with ESLint's `--max-warnings 0`.
- **To hide warnings** from build output, pass the linter's own flag, such as `--quiet` for [ESLint](/checkers/eslint#hide-warnings-in-build-mode) and [oxlint](/checkers/oxlint#hide-warnings).
- **In `vite build --watch`**, a failing check is reported but doesn't exit the process.

### Skip checks during build

If you already run type checks and linters as separate CI steps, set `enableBuild: false` to run the checkers only in dev mode:

```ts
checker({
  enableBuild: false,
  typescript: true,
})
```

## Next steps

- [Overlay and terminal](/guide/overlay): customize how dev mode results appear.
- [Shared options](/reference/shared-options): see every option that applies to all checkers.
