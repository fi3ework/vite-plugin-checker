# Plugin API

In dev mode, the plugin object returned by `checker()` exposes an `api` that other plugins and frameworks use to read diagnostics, follow runs as they happen, and show their own indicator in place of the badge. The API is typed as `CheckerApi`:

```ts
import type { CheckerApi } from 'vite-plugin-checker'
import type { Plugin } from 'vite'

const plugin = server.config.plugins.find(
  (plugin): plugin is Plugin<CheckerApi> =>
    plugin.name === 'vite-plugin-checker',
)
const api = plugin?.api
```

Every `checker()` instance in one Vite config shares the same checkers, diagnostics page, and indicator claims, so the `api` of any instance reports all of them. Separate dev servers (Vitest projects, for example) stay separate.

## `protocol`

- **Type:** `number`

Version of the state and event shapes below. It increases when they change incompatibly.

## `getState()`

- **Returns:** `CheckerState[]`

The current state of every checker:

```ts
interface CheckerState {
  id: string
  label: string
  status: 'starting' | 'checking' | 'idle' | 'failed'
  error?: string
  diagnostics: Diagnostic[]
  lastRun?: { startedAt: number; finishedAt?: number }
}
```

`'starting'` covers the first run after the dev server starts, and `'checking'` every later one. `error` is set while the status is `'failed'`. A second instance of the same checker in one config gets the id `<id>-2` and the label `<Label> (2)`.

Each diagnostic has a stable `id` while it's unchanged, its `level` (`'error'`, `'warning'`, or `'info'`), `message`, and, when known, `code` with `docsUrl`, the absolute `file` with `displayFile` relative to the root, 1-based `line` and `column`, and a `snippet` of the surrounding source lines.

## `subscribe(listener)`

- **Returns:** `() => void`, which removes the listener

Calls `listener` for every change after the current state. Read `getState()` first for the state at the time you subscribe.

| Event    | Fields                                               | When                                                                                                                                                       |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status` | `checkerId`, `label`, `status`, `error?`, `lastRun?` | A run starts, finishes, or fails                                                                                                                           |
| `update` | `checkerId`, `files`                                 | Diagnostics change. `files` maps absolute paths to the diagnostics of that file; file-less diagnostics are under `''`, and an empty array removes the file |

## `claimIndicator(owner)`

- **Returns:** `() => void`, which releases the claim

Hides the badge and drawer on every page because `owner` shows its own indicator. Claims are counted, so the badge returns once every owner has released, and releasing twice has no effect. The claim applies while [`overlay.badge`](/reference/shared-options#overlay-badge) is `'auto'`, which is the default.

## `getUiUrl()`

- **Returns:** `string`

Root-relative URL of the diagnostics page, including Vite's `base`, such as `/my-app/__checker/`. Append `?embed` when you show the page in a frame of your own; it then renders a compact header that fits a drawer or panel.

## `DOCK_ID`

- **Type:** `string`

Id of the Checker dock registered with Vite DevTools, exported from the package for integrations that switch to it:

```ts
import { DOCK_ID } from 'vite-plugin-checker'
```

## Example: replace the badge with your own indicator

A framework that already shows a status widget counts the checker's diagnostics there, and hides the badge while it does:

```ts
import type { CheckerApi } from 'vite-plugin-checker'
import type { Plugin, ViteDevServer } from 'vite'

export function checkerStatus(): Plugin {
  return {
    name: 'checker-status',
    configureServer(server: ViteDevServer) {
      const plugin = server.config.plugins.find(
        (plugin): plugin is Plugin<CheckerApi> =>
          plugin.name === 'vite-plugin-checker',
      )
      if (!plugin?.api) return

      const release = plugin.api.claimIndicator('checker-status')
      const show = () => {
        for (const checker of plugin.api!.getState()) {
          const errors = checker.diagnostics.filter(
            (d) => d.level === 'error',
          ).length
          statusWidget.set(checker.id, {
            label: checker.label,
            errors,
            href: plugin.api!.getUiUrl(),
          })
        }
      }

      show()
      const unsubscribe = plugin.api.subscribe(show)
      server.httpServer?.once('close', () => {
        unsubscribe()
        release()
      })
    },
  }
}
```

`statusWidget` stands for whatever the framework renders; the diagnostics page stays available for the full list.
