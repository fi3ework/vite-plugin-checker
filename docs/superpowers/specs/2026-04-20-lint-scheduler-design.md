# Lint Scheduler: Coalesce and Serialize One-Shot Checker Runs

Issue: [fi3ework/vite-plugin-checker#706](https://github.com/fi3ework/vite-plugin-checker/issues/706)

## Problem

Four one-shot checkers (oxlint, biome, eslint, stylelint) each call their linter directly from a chokidar `change` event handler. There is no debounce, no concurrency control, no abort of in-flight runs, and no retained process handle. A filesystem burst — routine with multi-file saves, format-on-save, git operations, and especially AI-assisted editing — spawns one full lint run per event, concurrently.

The cost scales linearly with burst size. For `oxlint` with `oxlint-tsgolint`, each cold invocation is ~0.5 s / ~560 MB RSS; a 10-file burst produces ~10 concurrent subprocesses with ~5.6 GB peak; larger bursts push the system into memory pressure. The concurrent work is also wasted — each run's result is discarded the moment a later file change arrives.

## Goal

Introduce a shared helper, `createLintScheduler`, that coalesces filesystem events into batches and serializes lint runs so that **at most one lint run is in flight per checker at any time**. Apply the helper to all four one-shot checkers in a single change. No new public configuration.

## Non-goals

- No configurable debounce window, no concurrency-cap knob, no enable/disable flag in this change. Debounce is hard-coded to 300 ms.
- No aborting of in-flight runs. An in-flight run is allowed to finish; new events accumulate into the next run.
- No changes to the `typescript` or `vueTsc` checkers. They use a long-running `tsc --watch` and are unaffected.

## Design

### The scheduler

A new module, `packages/vite-plugin-checker/src/checkers/_shared/lintScheduler.ts`, exports:

```ts
export interface LintScheduler {
  schedule(filePath: string): void
  dispose(): Promise<void>
}

export function createLintScheduler(opts: {
  debounceMs: number
  onBatch: (files: string[]) => Promise<void>
}): LintScheduler
```

Internal state:

- `pending: Set<string>` — absolute file paths accumulated since the last batch was started
- `timer: NodeJS.Timeout | null` — current debounce timer
- `inFlight: Promise<void> | null` — the promise returned by `onBatch`, if a batch is running
- `disposed: boolean` — set true once `dispose()` is called

Behavior:

1. **`schedule(filePath)`**
   - If `disposed`, no-op.
   - Add `filePath` to `pending`.
   - Clear any existing `timer` and start a new one for `debounceMs`.

2. **Timer fires**
   - Clear `timer`.
   - If `inFlight` is non-null, do nothing; the in-flight run's completion handler will drain `pending`.
   - Else, snapshot `pending`, clear `pending`, call `onBatch(snapshot)` and store the returned promise in `inFlight`. On settle (resolve or reject), set `inFlight = null`. If `pending` is non-empty and `disposed` is false, immediately start another run (no additional debounce — events were delayed by the in-flight run already); if `pending` is empty, do nothing.
   - Any exception thrown by `onBatch` is caught and logged to the console; the scheduler recovers and continues to accept new events. One failed lint run must not wedge the checker.

3. **`dispose()`**
   - Set `disposed = true`.
   - Clear `timer` if present; discard any `pending` that has not yet been submitted to `onBatch`.
   - Return a promise that resolves when `inFlight` settles (or immediately, if nothing is in flight).
   - After `dispose()`, `schedule()` is a no-op. A stray chokidar event arriving during teardown is safe.

The scheduler does not know about the manager, dispatch, linters, or config files. It is a generic "collect, debounce, serialize" primitive.

### The batched-diagnostic helper

Co-located in `_shared/`, a pure helper:

```ts
export function applyBatchedDiagnostics(
  manager: FileDiagnosticManager,
  batch: string[],                       // absolute paths the batch was run over
  diagnostics: NormalizedDiagnostic[],   // flat list returned by the linter
): void
```

Behavior:

- Bucket `diagnostics` by `diagnostic.id` into `Map<string, NormalizedDiagnostic[]>`. For all four checkers, `NormalizedDiagnostic.id` is the absolute file path (verified: `src/checkers/oxlint/cli.ts:133`, `src/checkers/biome/cli.ts:139`, `src/logger.ts:380` for eslint, `src/logger.ts:418` for stylelint).
- Diagnostics whose `id` is `undefined` or empty string (stylelint can produce these for stdin-sourced input) are dropped during bucketing — they cannot be matched to a file in the batch and have nowhere to go. This is a log-and-skip, not an error.
- For each `file` in `batch`, call `manager.updateByFileId(file, byFile.get(file) ?? [])`.
- Files in the batch that produced no diagnostics get their stale diagnostics cleared to `[]`.
- Files not in the batch are left untouched.

**Path normalization.** The batch paths are absolute (see the path contract above). The linter's diagnostic `id`s are absolute after each checker's own normalization. To harden against a checker whose normalizer produces a path that differs from `path.resolve(root, relPath)` in casing, separators, or symlink resolution, `applyBatchedDiagnostics` calls `sources.ts`'s `normalizePath(p, root)` on both the batch paths and each diagnostic's `id` before keying.

### Per-checker wiring

Each checker's existing `watcher.on('change', handleFileChange)` shrinks to a small async handler that (a) resolves the chokidar-relative path to absolute via `path.resolve(root, filePath)`, (b) applies any per-file pre-filter (see eslint below), and (c) calls `scheduler.schedule(absPath)`. The body of `handleFileChange` moves into the `onBatch` callback, promoted from per-file to batched.

**Path contract.** `scheduler.schedule()` is always called with an absolute path. `pending` holds absolute paths. The `files: string[]` handed to `onBatch` is absolute. This matches the existing per-file behavior (each checker resolves to `absPath` before calling its linter) and makes path matching against `NormalizedDiagnostic.id` (also absolute, after the linter's own normalization) consistent without additional resolution inside `onBatch`.

The `unlink` handler is unchanged in shape: it calls `manager.updateByFileId(absPath, [])` directly and does not involve the scheduler. Unlinks are cheap and do not spawn lint runs.

**Config-file handling.** `biome` and `oxlint` have a special branch today: when the changed file is the linter's config, they run a full-project scan and call `manager.initWith(...)` instead of the per-file path. This branch remains, but moves inside `onBatch`:

```ts
// sketch for oxlint/server.ts onBatch
onBatch: async (files) => {
  const configFile = files.find((f) => path.basename(f) === '.oxlintrc.json')
  if (configFile) {
    // config change supersedes per-file work in this batch
    const diagnostics = await runOxlint(`${command} ${root}`, root)
    manager.initWith(diagnostics)
  } else {
    const diagnostics = await runOxlint(`${command} ${files.join(' ')}`, root)
    applyBatchedDiagnostics(manager, files, diagnostics)
  }
  dispatchDiagnostics(
    filterLogLevel(manager.getDiagnostics(), options.logLevel),
    displayTargets,
  )
}
```

`biome` follows the same shape with `biome.json` as the config filename. `eslint` and `stylelint` have no config-file branch and skip the check.

**Per-checker quirks to preserve:**

- **eslint** performs two per-file checks before running its linter today: an extension filter (legacy `--ext` mode only) and `eslint.isPathIgnored(filePath)` (async). In the batched world, these filters must run in the `watcher.on('change')` handler before `scheduler.schedule()`, so the batch handed to `eslint.lintFiles(files)` is already filtered. The handler becomes `async` and `await`s `isPathIgnored`; a burst of 10 events starts 10 concurrent `isPathIgnored` calls, which is cheap (pure path-match against config) and unrelated to the lint-subprocess concern this PR addresses.
- **biome** today calls `getBiomeCommand(command, flags, absPath)` (`src/checkers/biome/cli.ts:21` — third arg is typed `string`, a single path). In the batched world, no signature change: pass `files.join(' ')` to the same third parameter. The Biome CLI accepts multiple path arguments appended after flags, so the joined string works as-is.
- **oxlint** today passes a single path as the last argument of the command string (`server.ts:67`: `${command} ${absPath}`). Batched call joins all paths: `${command} ${files.join(' ')}`. The CLI accepts multiple.
- **stylelint** today passes `files: filePath` to `stylelint.lint()` (`main.ts:106`). In the batched world, pass `files: files` (the absolute-path array from the scheduler). `stylelint.lint`'s `files` option accepts an array.

### Disposal wiring

Wherever a checker already closes its chokidar watcher on Vite shutdown, add a `scheduler.dispose()` call alongside it. Do not introduce new shutdown hooks in checkers that lack one today; the scheduler is resilient to not being disposed (events simply stop arriving when the watcher closes, and the process exits shortly after). `dispose()` exists as part of the scheduler's contract for correctness and testability, not as a mandatory wiring point in this change.

## Testing

### Unit tests for `createLintScheduler`

New file `packages/vite-plugin-checker/__tests__/lintScheduler.spec.ts`. Uses Vitest fake timers. The scheduler is pure control flow (no fs, no child processes), fully testable in isolation.

1. `schedule('a')`, advance timer → `onBatch(['a'])` called exactly once.
2. `schedule('a'); schedule('b')` within window → one `onBatch(['a', 'b'])`.
3. `schedule('a'); schedule('a')` → deduped to one call with `['a']`.
4. Events arriving during an in-flight `onBatch` accumulate and trigger a follow-up call after the current one resolves. No debounce delay before the follow-up.
5. Invariant: never two `onBatch` calls in flight simultaneously, under any schedule.
6. `dispose()` while `inFlight` is pending resolves only after the in-flight batch settles.
7. `dispose()` while `timer` is pending but no batch is running: timer is cleared, `pending` is discarded, `dispose()` resolves immediately.
8. `schedule()` after `dispose()` is a safe no-op. No crash, no queued batch.
9. `onBatch` rejects → scheduler logs, recovers, and accepts new events; a subsequent `schedule()` still triggers `onBatch`.
10. `onBatch` that never resolves — documented contract: `dispose()` awaits it. Callers must ensure their `onBatch` promise terminates. A test uses a manually-resolved promise to verify that `dispose()` does not resolve until the caller resolves the batch, confirming the contract is observable.

### Unit tests for `applyBatchedDiagnostics`

Small, pure, table-driven.

1. Empty batch, empty diagnostics → no manager calls.
2. Batch `['a']`, diagnostics include one entry with `id: 'a'` → manager updated with that diagnostic for `'a'`.
3. Batch `['a', 'b']`, diagnostics only for `'a'` → manager called twice: `updateByFileId('a', [...])` and `updateByFileId('b', [])`. Explicit: a file in the batch that the linter returned nothing for is a clean file and its stale diagnostics are cleared.
4. Batch `['a']`, diagnostics include entries for `'a'` and `'c'` → manager only called for `'a'`. Files not in the batch (`'c'`) are not touched, even if the linter returned data about them.
5. Path normalization: a diagnostic whose `id` arrives through the linter with a trailing separator, mixed casing, or unresolved `.` segment still buckets correctly after `normalizePath(p, root)`. Guards against a future checker whose normalizer differs from `sources.ts`.
6. `undefined` / empty-string `id`: diagnostics with no `id` are dropped during bucketing and do not crash. Relevant for stylelint's stdin case.

### End-to-end coverage

No new e2e tests. The existing playground e2e tests (`playground/{oxlint-default,biome-default,eslint-default,stylelint-default}/__tests__/test.spec.ts`) confirm single-file edits produce correct diagnostics. `sleepForEdit()` is 2 s local / 4 s CI, well beyond the 300 ms debounce plus linter runtime; no flakiness risk. A burst-simulation e2e would be timing-sensitive, machine-dependent, and would not pull its weight relative to the scheduler's unit coverage.

## Risks

- **Latency increase for single-file edits.** Diagnostics appear ~300 ms later than today for a lone change. Imperceptible in typical use but worth calling out in the release notes.
- **Path normalization mismatches.** If a checker's normalizer diverges from `sources.ts`'s `normalizePath`, `applyBatchedDiagnostics` can silently clear diagnostics for a file whose bucket key doesn't match. Unit-test case 5 guards this; any future checker must use the shared `normalizePath`.
- **Linter CLI behavior with multiple paths.** Assumed: oxlint, biome, eslint, stylelint all accept multiple path arguments and lint them independently. If a checker has a mode where multiple paths change semantics (e.g., treating them as a project root), this assumption breaks. Verified today: all four accept path lists.
- **Runaway `onBatch` promises.** The scheduler relies on callers to resolve `onBatch`. A linter that hangs will block all subsequent runs. Today's behavior is worse (many hung processes); the new behavior surfaces the hang clearly as "no new diagnostics" rather than memory exhaustion. Acceptable.

## Rollout

Single PR:

1. Add `src/checkers/_shared/lintScheduler.ts` and `src/checkers/_shared/applyBatchedDiagnostics.ts`.
2. Add unit tests (`__tests__/lintScheduler.spec.ts`, `__tests__/applyBatchedDiagnostics.spec.ts`).
3. Wire each checker:
   - `src/checkers/oxlint/server.ts`
   - `src/checkers/biome/main.ts`
   - `src/checkers/eslint/main.ts`
   - `src/checkers/stylelint/main.ts`
4. Run existing unit tests, playground e2e, and publint. No public API changes.

## Out of scope / follow-ups

- Exposing `debounceMs` or a concurrency cap as a plugin option. Ship defaults first; expose if feedback requires.
- Cross-checker coordination (one scheduler shared by all four, so that the total in-flight-lints invariant is ≤ 1 across the whole plugin). Today each checker has its own scheduler; peak memory for a user running oxlint + biome + eslint concurrently is the sum of each checker's single in-flight run, which is still a massive improvement over today's N-per-event.
- Migrating PR #216's opt-in `dev.debounce` configuration. Superseded by this change.
