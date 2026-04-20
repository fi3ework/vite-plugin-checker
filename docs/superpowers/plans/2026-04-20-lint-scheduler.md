# Lint Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a shared debounce/coalesce/serialize helper for the four one-shot checkers (oxlint, biome, eslint, stylelint) so a burst of filesystem events no longer spawns N concurrent lint subprocesses.

**Architecture:** A pure `createLintScheduler` primitive (no fs, no child_process) collects absolute file paths via `schedule()`, debounces (300 ms), coalesces into a `Set`, and invokes a user-supplied `onBatch(files)` callback. At most one `onBatch` is in flight at a time; events arriving during an in-flight run accumulate and trigger the next run immediately on completion. A second tiny helper, `applyBatchedDiagnostics`, buckets a flat diagnostic list by file and applies per-file updates to `FileDiagnosticManager`, correctly clearing stale errors for now-clean files. Each of the four checkers is rewired to call `scheduler.schedule(absPath)` from its `watcher.on('change')` handler; the body of its old `handleFileChange` moves into the `onBatch` callback, promoted from per-file to batched.

**Tech Stack:** TypeScript, Vitest (with fake timers), chokidar, Node `child_process.exec`. Biome for formatting/linting.

**Spec:** `docs/superpowers/specs/2026-04-20-lint-scheduler-design.md`

---

## File Structure

**New files:**

- `packages/vite-plugin-checker/src/checkers/_shared/lintScheduler.ts` — scheduler primitive
- `packages/vite-plugin-checker/src/checkers/_shared/applyBatchedDiagnostics.ts` — manager-update helper
- `packages/vite-plugin-checker/__tests__/lintScheduler.spec.ts` — unit tests for scheduler
- `packages/vite-plugin-checker/__tests__/applyBatchedDiagnostics.spec.ts` — unit tests for helper

**Modified files:**

- `packages/vite-plugin-checker/src/checkers/oxlint/server.ts`
- `packages/vite-plugin-checker/src/checkers/biome/main.ts`
- `packages/vite-plugin-checker/src/checkers/eslint/main.ts`
- `packages/vite-plugin-checker/src/checkers/stylelint/main.ts`

All work runs from repo root `/Users/dmitrii/source/vite-plugin-checker`. Unit tests: `pnpm test-unit`. E2E tests: `pnpm test-serve` (watches tests; prefer `pnpm test-serve` only over `pnpm test` for faster iteration — `pnpm test` also runs `test-build` which is slow).

---

### Task 1: `applyBatchedDiagnostics` helper (TDD)

**Files:**
- Create: `packages/vite-plugin-checker/src/checkers/_shared/applyBatchedDiagnostics.ts`
- Test: `packages/vite-plugin-checker/__tests__/applyBatchedDiagnostics.spec.ts`

**Why first:** Pure function, zero dependencies on the scheduler. Small, easy to get right, and lets us prove the bucketing/normalization before we touch any checker wiring.

- [ ] **Step 1: Write the failing tests**

Create `packages/vite-plugin-checker/__tests__/applyBatchedDiagnostics.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { applyBatchedDiagnostics } from '../src/checkers/_shared/applyBatchedDiagnostics'
import { FileDiagnosticManager } from '../src/FileDiagnosticManager'
import type { NormalizedDiagnostic } from '../src/logger'

const ROOT = '/repo'
const fileA = '/repo/src/a.ts'
const fileB = '/repo/src/b.ts'
const fileC = '/repo/src/c.ts'

function diag(id: string, message: string): NormalizedDiagnostic {
  return {
    id,
    message,
    checker: 'test',
  } as NormalizedDiagnostic
}

describe('applyBatchedDiagnostics', () => {
  it('empty batch + empty diagnostics produces no manager calls', () => {
    const manager = new FileDiagnosticManager()
    const spy = vi.spyOn(manager, 'updateByFileId')
    applyBatchedDiagnostics(manager, [], [], ROOT)
    expect(spy).not.toHaveBeenCalled()
  })

  it('routes a diagnostic to the matching file in the batch', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    applyBatchedDiagnostics(manager, [fileA], [diag(fileA, 'oops')], ROOT)
    expect(manager.getDiagnostics(fileA)).toHaveLength(1)
    expect(manager.getDiagnostics(fileA)[0]?.message).toBe('oops')
  })

  it('clears stale diagnostics for files in the batch with no new diagnostics', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(fileA, 'stale-a'), diag(fileB, 'stale-b')])
    applyBatchedDiagnostics(
      manager,
      [fileA, fileB],
      [diag(fileA, 'new-a')],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'new-a',
    ])
    // fileB was in the batch, linter returned nothing → stale cleared
    expect(manager.getDiagnostics(fileB)).toEqual([])
  })

  it('does not touch files outside the batch', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(fileC, 'untouched')])
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [diag(fileA, 'a'), diag(fileC, 'ignored')],
      ROOT,
    )
    // fileC was not in the batch; its prior diagnostic must remain,
    // and the spurious diagnostic for fileC from the linter is ignored.
    expect(manager.getDiagnostics(fileC).map((d) => d.message)).toEqual([
      'untouched',
    ])
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual(['a'])
  })

  it('normalizes paths on both sides before bucketing', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    // diagnostic id has a trailing separator + unresolved . segment
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [diag('/repo/src/./a.ts', 'normed')],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'normed',
    ])
  })

  it('drops diagnostics with undefined or empty id without crashing', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [
        { checker: 'test', message: 'no-id' } as NormalizedDiagnostic,
        { id: '', checker: 'test', message: 'empty-id' } as NormalizedDiagnostic,
        diag(fileA, 'keeper'),
      ],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'keeper',
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run from repo root:

```bash
pnpm --filter vite-plugin-checker exec vitest run __tests__/applyBatchedDiagnostics.spec.ts
```

Expected: test file fails to resolve `../src/checkers/_shared/applyBatchedDiagnostics` — the module doesn't exist yet.

- [ ] **Step 3: Create the helper**

Create `packages/vite-plugin-checker/src/checkers/_shared/applyBatchedDiagnostics.ts`:

```ts
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { normalizePath } from '../../sources.js'

/**
 * Bucket a flat diagnostic list by file and write per-file diagnostics
 * to the manager. Every file in `batch` is written (empty list clears
 * stale diagnostics). Files not in `batch` are untouched.
 *
 * Paths are normalized via `sources.ts#normalizePath(root)` on both sides
 * before keying to defend against checker normalizers that differ in
 * casing, separators, or unresolved `.` segments.
 */
export function applyBatchedDiagnostics(
  manager: FileDiagnosticManager,
  batch: string[],
  diagnostics: NormalizedDiagnostic[],
  root: string,
): void {
  const byFile = new Map<string, NormalizedDiagnostic[]>()
  for (const d of diagnostics) {
    if (!d.id) continue // stylelint stdin or malformed entries
    const key = normalizePath(d.id, root)
    const bucket = byFile.get(key)
    if (bucket) {
      bucket.push(d)
    } else {
      byFile.set(key, [d])
    }
  }

  for (const file of batch) {
    const key = normalizePath(file, root)
    manager.updateByFileId(file, byFile.get(key) ?? [])
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter vite-plugin-checker exec vitest run __tests__/applyBatchedDiagnostics.spec.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/_shared/applyBatchedDiagnostics.ts packages/vite-plugin-checker/__tests__/applyBatchedDiagnostics.spec.ts
git commit -m "$(cat <<'EOF'
feat: add applyBatchedDiagnostics helper

Routes a flat diagnostic list from a multi-file lint run to per-file
manager entries, clearing stale diagnostics for files in the batch that
came back clean. Normalizes paths on both sides before bucketing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `createLintScheduler` primitive (TDD)

**Files:**
- Create: `packages/vite-plugin-checker/src/checkers/_shared/lintScheduler.ts`
- Test: `packages/vite-plugin-checker/__tests__/lintScheduler.spec.ts`

**Design recap (from spec):** `pending: Set<string>`, `timer`, `inFlight`, `disposed` flags. `schedule(p)` adds to pending and restarts the debounce timer. Timer fire and in-flight completion both call an internal `drain()`. `drain()` snapshots pending, clears pending and timer, calls `onBatch(snapshot)`, and re-calls itself from the `.finally` to pick up anything that accumulated during the run. `dispose()` flips `disposed`, clears pending + timer, returns the in-flight promise (or resolved promise if idle). `schedule()` post-dispose is a no-op.

- [ ] **Step 1: Write the failing tests**

Create `packages/vite-plugin-checker/__tests__/lintScheduler.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLintScheduler } from '../src/checkers/_shared/lintScheduler'

const DEBOUNCE = 300

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Flushes queued microtasks so that `.then`/`.finally` chains settle.
async function tick() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('createLintScheduler', () => {
  it('debounces a single scheduled file into one onBatch call', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    expect(onBatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith(['/r/a'])
  })

  it('coalesces multiple files within the debounce window', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    s.schedule('/r/b')
    s.schedule('/r/c')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch.mock.calls[0]?.[0]?.sort()).toEqual(['/r/a', '/r/b', '/r/c'])
  })

  it('dedupes repeated schedules of the same file', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    s.schedule('/r/a')
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith(['/r/a'])
  })

  it('coalesces events arriving during an in-flight run into a follow-up batch', async () => {
    let resolveFirst: () => void = () => {}
    const firstPromise = new Promise<void>((r) => {
      resolveFirst = r
    })
    const onBatch = vi
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce(undefined)

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenNthCalledWith(1, ['/r/a'])

    // Arrive during in-flight: should accumulate, not fire a concurrent call.
    s.schedule('/r/b')
    s.schedule('/r/c')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1) // still only the first call

    resolveFirst()
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(2)
    expect(onBatch.mock.calls[1]?.[0]?.sort()).toEqual(['/r/b', '/r/c'])
  })

  it('never has two onBatch calls in flight simultaneously', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const onBatch = vi.fn().mockImplementation(async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await Promise.resolve()
      inFlight--
    })

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    for (let i = 0; i < 10; i++) {
      s.schedule(`/r/${i}`)
      vi.advanceTimersByTime(DEBOUNCE / 2)
    }
    vi.advanceTimersByTime(DEBOUNCE)
    // Flush enough microtasks to drain any cascade.
    for (let i = 0; i < 20; i++) await tick()

    expect(maxInFlight).toBe(1)
  })

  it('dispose() while in-flight resolves only after the batch settles', async () => {
    let resolveBatch: () => void = () => {}
    const onBatch = vi.fn().mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolveBatch = r
        }),
    )

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)

    const disposed = s.dispose()
    let resolved = false
    disposed.then(() => {
      resolved = true
    })
    await tick()
    expect(resolved).toBe(false)

    resolveBatch()
    await tick()
    expect(resolved).toBe(true)
  })

  it('dispose() with pending timer but no in-flight resolves immediately and discards pending', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')

    await s.dispose()

    // Advance past where the timer would have fired; onBatch must not run.
    vi.advanceTimersByTime(DEBOUNCE * 5)
    await tick()
    expect(onBatch).not.toHaveBeenCalled()
  })

  it('schedule() after dispose() is a safe no-op', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    await s.dispose()

    expect(() => s.schedule('/r/a')).not.toThrow()
    vi.advanceTimersByTime(DEBOUNCE * 5)
    await tick()
    expect(onBatch).not.toHaveBeenCalled()
  })

  it('recovers from a rejecting onBatch and accepts new schedules', async () => {
    const err = new Error('boom')
    const onBatch = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce(undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalled()

    s.schedule('/r/b')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(2)
    expect(onBatch).toHaveBeenNthCalledWith(2, ['/r/b'])
  })

  it('dispose() awaits a never-resolving onBatch (observable contract)', async () => {
    const onBatch = vi.fn().mockImplementation(() => new Promise<void>(() => {}))
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)

    const disposed = s.dispose()
    let resolved = false
    disposed.then(() => {
      resolved = true
    })
    for (let i = 0; i < 5; i++) await tick()
    expect(resolved).toBe(false)
    // No assertion that it ever resolves — contract is: callers must resolve onBatch.
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter vite-plugin-checker exec vitest run __tests__/lintScheduler.spec.ts
```

Expected: all tests fail to resolve `../src/checkers/_shared/lintScheduler` — module doesn't exist yet.

- [ ] **Step 3: Implement the scheduler**

Create `packages/vite-plugin-checker/src/checkers/_shared/lintScheduler.ts`:

```ts
export interface LintScheduler {
  /** Enqueue an absolute file path for the next batch. No-op after dispose. */
  schedule(filePath: string): void
  /**
   * Stop accepting new events, discard pending files that have not yet been
   * submitted, and return a promise that resolves when any in-flight batch
   * finishes. Callers must ensure their `onBatch` eventually settles — a
   * hanging `onBatch` will hang `dispose()`.
   */
  dispose(): Promise<void>
}

export interface LintSchedulerOptions {
  debounceMs: number
  onBatch: (files: string[]) => Promise<void>
}

export function createLintScheduler(opts: LintSchedulerOptions): LintScheduler {
  const { debounceMs, onBatch } = opts

  const pending = new Set<string>()
  let timer: NodeJS.Timeout | null = null
  let inFlight: Promise<void> | null = null
  let disposed = false

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function drain(): void {
    if (disposed || inFlight || pending.size === 0) return
    clearTimer()
    const snapshot = [...pending]
    pending.clear()

    const run = Promise.resolve()
      .then(() => onBatch(snapshot))
      .catch((err) => {
        // One failed lint run must not wedge the checker. Log and continue.
        console.error('[vite-plugin-checker] lint batch failed:', err)
      })
      .finally(() => {
        inFlight = null
        drain()
      })
    inFlight = run
  }

  return {
    schedule(filePath: string) {
      if (disposed) return
      pending.add(filePath)
      clearTimer()
      timer = setTimeout(() => {
        timer = null
        drain()
      }, debounceMs)
    },

    dispose() {
      disposed = true
      clearTimer()
      pending.clear()
      return inFlight ?? Promise.resolve()
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter vite-plugin-checker exec vitest run __tests__/lintScheduler.spec.ts
```

Expected: all 10 tests pass.

If a test fails, note: the `tick()` helper flushes three microtask ticks, which is enough for a single promise chain `resolve → .then → .catch → .finally`. If you add a longer chain internally, bump the tick count in the failing test or call `await tick()` more than once.

- [ ] **Step 5: Run the full unit-test suite to confirm no regressions elsewhere**

```bash
pnpm test-unit
```

Expected: all pre-existing unit tests still pass alongside the new ones.

- [ ] **Step 6: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/_shared/lintScheduler.ts packages/vite-plugin-checker/__tests__/lintScheduler.spec.ts
git commit -m "$(cat <<'EOF'
feat: add createLintScheduler primitive

Debounces chokidar events, coalesces them into a Set, and serializes
calls to an onBatch callback (at most one in flight at a time). Events
arriving during an in-flight batch accumulate and trigger the next run
immediately on completion. dispose() discards pending and awaits any
in-flight batch. Rejecting onBatch is logged and the scheduler recovers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire oxlint

**Files:**
- Modify: `packages/vite-plugin-checker/src/checkers/oxlint/server.ts` (full replacement below)

**Current shape (`server.ts`):** fires `runOxlint` synchronously per chokidar event; has a config-file branch for `.oxlintrc.json` that runs a full scan. After the change, the `watcher.on('change')` handler only resolves the path and calls `scheduler.schedule(absPath)`; `onBatch` runs the lint (batched for file changes, full-scan for config changes) and routes diagnostics through `applyBatchedDiagnostics` or `manager.initWith`.

- [ ] **Step 1: Replace the body of `setupDevServer`**

Replace the entire contents of `packages/vite-plugin-checker/src/checkers/oxlint/server.ts` with:

```ts
import path from 'node:path'
import chokidar from 'chokidar'
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel } from '../../logger.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import { createLintScheduler } from '../_shared/lintScheduler.js'
import { runOxlint } from './cli.js'
import { dispatchDiagnostics } from './diagnostics.js'
import type { ResolvedOptions } from './options.js'
import type { DisplayTarget } from './types'

const DEBOUNCE_MS = 300

export async function setupDevServer(
  root: string,
  options: ResolvedOptions,
  manager: FileDiagnosticManager,
  displayTargets: Set<DisplayTarget>,
): Promise<void> {
  const initial = await runOxlint(options.command, root)
  manager.initWith(initial)
  dispatchDiagnostics(
    filterLogLevel(manager.getDiagnostics(), options.logLevel),
    displayTargets,
  )

  const dispatch = () =>
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )

  const scheduler = createLintScheduler({
    debounceMs: DEBOUNCE_MS,
    onBatch: async (files) => {
      const hasConfigChange = files.some(
        (f) => path.basename(f) === '.oxlintrc.json',
      )
      if (hasConfigChange) {
        const diagnostics = await runOxlint(`${options.command} ${root}`, root)
        manager.initWith(diagnostics)
      } else {
        const diagnostics = await runOxlint(
          `${options.command} ${files.join(' ')}`,
          root,
        )
        applyBatchedDiagnostics(manager, files, diagnostics, root)
      }
      dispatch()
    },
  })

  const watcher = chokidar.watch(options.watchTarget, {
    cwd: root,
    ignored: (p: string) => p.includes('node_modules'),
  })

  watcher.on('change', (filePath) => {
    scheduler.schedule(path.resolve(root, filePath))
  })

  watcher.on('unlink', (filePath) => {
    const absPath = path.resolve(root, filePath)
    manager.updateByFileId(absPath, [])
    dispatch()
  })
}
```

- [ ] **Step 2: Type-check the package**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run the oxlint playground e2e**

```bash
pnpm -r --filter='./packages/**' run build
pnpm test-serve -- playground/oxlint-default
```

Expected: oxlint-default test suite passes. `sleepForEdit()` (2 s local / 4 s CI) exceeds the 300 ms debounce + lint runtime, so no timing regressions.

- [ ] **Step 4: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/oxlint/server.ts
git commit -m "$(cat <<'EOF'
feat(oxlint): route watcher events through lint scheduler

Single-file oxlint exec per chokidar event is replaced with a
debounced, coalesced, serialized batch run. Config-file changes still
trigger a full-project scan via manager.initWith. Closes part of #706.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Wire biome

**Files:**
- Modify: `packages/vite-plugin-checker/src/checkers/biome/main.ts` (only the watcher section and `handleFileChange` body)

**Shape:** same scheduler, same config-file branch (`biome.json`). `getBiomeCommand(command, flags, files: string)` keeps its `string` third arg — we pass `files.join(' ')`.

- [ ] **Step 1: Replace the watcher wiring in `configureServer`**

Open `packages/vite-plugin-checker/src/checkers/biome/main.ts`. Add imports at the top of the file next to the existing ones:

```ts
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import { createLintScheduler } from '../_shared/lintScheduler.js'
```

Add a constant just above `const createDiagnostic: CreateDiagnostic<'biome'>`:

```ts
const DEBOUNCE_MS = 300
```

Replace the block that starts with `const handleFileChange = async (` and ends at `watcher.on('unlink', async (filePath) => { ... })` (currently lines 91–142) with:

```ts
      const scheduler = createLintScheduler({
        debounceMs: DEBOUNCE_MS,
        onBatch: async (files) => {
          const hasConfigChange = files.some(
            (f) => path.basename(f) === 'biome.json',
          )
          if (hasConfigChange) {
            const runCommand = getBiomeCommand(command, flags, root)
            const diagnostics = await runBiome(runCommand, root)
            manager.initWith(diagnostics)
          } else {
            const runCommand = getBiomeCommand(command, flags, files.join(' '))
            const diagnostics = await runBiome(runCommand, root)
            applyBatchedDiagnostics(manager, files, diagnostics, root)
          }
          dispatchDiagnostics()
        },
      })

      // initial check
      const runCommand = getBiomeCommand(command, flags, root)
      const diagnostics = await runBiome(runCommand, root)

      manager.initWith(diagnostics)
      dispatchDiagnostics()

      // watch lint
      let watchTarget: string | string[] = root
      if (typeof biomeConfig === 'object' && biomeConfig.watchPath) {
        if (Array.isArray(biomeConfig.watchPath)) {
          watchTarget = biomeConfig.watchPath.map((p) => path.resolve(root, p))
        } else {
          watchTarget = path.resolve(root, biomeConfig.watchPath)
        }
      }

      const watcher = chokidar.watch(watchTarget, {
        cwd: root,
        ignored: (p: string) => p.includes('node_modules'),
      })
      watcher.on('change', (filePath) => {
        scheduler.schedule(path.resolve(root, filePath))
      })
      watcher.on('unlink', (filePath) => {
        const absPath = path.resolve(root, filePath)
        manager.updateByFileId(absPath, [])
        dispatchDiagnostics()
      })
```

Note: the original file placed the `initial check` block after `handleFileChange`. The replacement above preserves that ordering — `scheduler` is defined before the initial check runs, and the initial check still uses `manager.initWith` directly (not through the scheduler).

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run biome playground e2e**

```bash
pnpm -r --filter='./packages/**' run build
pnpm test-serve -- playground/biome-default
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/biome/main.ts
git commit -m "$(cat <<'EOF'
feat(biome): route watcher events through lint scheduler

Debounces and coalesces biome exec runs. biome.json config changes
still trigger a full-project scan via manager.initWith. Part of #706.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Wire eslint

**Files:**
- Modify: `packages/vite-plugin-checker/src/checkers/eslint/main.ts` (only the watcher section)

**Quirk:** eslint has a legacy-mode extension filter and an async `eslint.isPathIgnored(filePath)` call. Both must run **before** `scheduler.schedule()`, not inside `onBatch`, so the batch passed to `eslint.lintFiles(files)` is already filtered to lintable files. No config-file branch.

- [ ] **Step 1: Replace the watcher wiring in `configureServer`**

Open `packages/vite-plugin-checker/src/checkers/eslint/main.ts`. Add imports next to the existing ones at the top:

```ts
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import { createLintScheduler } from '../_shared/lintScheduler.js'
```

Add a constant after the imports (e.g., just above `const manager = new FileDiagnosticManager()`):

```ts
const DEBOUNCE_MS = 300
```

Replace the block starting at `const handleFileChange = async (` (currently line 176) through the end of the two `watcher.on(...)` calls (currently line 234) with:

```ts
      const scheduler = createLintScheduler({
        debounceMs: DEBOUNCE_MS,
        onBatch: async (files) => {
          const diagnosticsOfChangedFiles = await eslint.lintFiles(files)
          const newDiagnostics = diagnosticsOfChangedFiles.flatMap((d) =>
            normalizeEslintDiagnostic(d),
          )
          applyBatchedDiagnostics(manager, files, newDiagnostics, root)
          dispatchDiagnostics()
        },
      })

      const shouldLintPath = async (filePath: string): Promise<boolean> => {
        // Legacy-mode extension filter (only meaningful if --ext was provided).
        if (!effectiveUseFlatConfig) {
          const extension = path.extname(filePath)
          const { extensions } = eslintOptions as any
          const hasExtensionsConfig = Array.isArray(extensions)
          if (hasExtensionsConfig && !extensions.includes(extension)) {
            return false
          }
        }
        // Honor .eslintignore / ignorePatterns.
        const isIgnored = await eslint.isPathIgnored(filePath)
        return !isIgnored
      }

      // initial lint
      const files = options._.slice(1) as string[]
      const diagnostics = await eslint.lintFiles(files)

      manager.initWith(diagnostics.flatMap((p) => normalizeEslintDiagnostic(p)))
      dispatchDiagnostics()

      // watch lint
      let watchTarget: string | string[] = root
      if (pluginConfig.eslint.watchPath) {
        if (Array.isArray(pluginConfig.eslint.watchPath)) {
          watchTarget = pluginConfig.eslint.watchPath.map((p) =>
            path.resolve(root, p),
          )
        } else {
          watchTarget = path.resolve(root, pluginConfig.eslint.watchPath)
        }
      }

      const watcher = chokidar.watch(watchTarget, {
        cwd: root,
        ignored: createIgnore(root, files),
      })

      watcher.on('change', async (filePath) => {
        if (!(await shouldLintPath(filePath))) return
        scheduler.schedule(path.resolve(root, filePath))
      })
      watcher.on('unlink', (filePath) => {
        const absPath = path.resolve(root, filePath)
        manager.updateByFileId(absPath, [])
        dispatchDiagnostics()
      })
```

Note: `shouldLintPath` receives the raw chokidar-relative `filePath`. `eslint.isPathIgnored` accepts relative paths resolved against `cwd` (the `cwd: root` option on ESLint), so passing `filePath` unchanged matches the pre-existing behavior at the original line 188. The scheduler receives the resolved absolute path.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run eslint playground e2e**

```bash
pnpm -r --filter='./packages/**' run build
pnpm test-serve -- playground/eslint-default playground/eslint-config-log-level playground/eslint-flat
```

Expected: all three pass. These cover default behavior, log-level filtering, and flat-config mode.

- [ ] **Step 4: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/eslint/main.ts
git commit -m "$(cat <<'EOF'
feat(eslint): route watcher events through lint scheduler

Per-file extension filter and isPathIgnored check run in the chokidar
handler before scheduling, so the batched eslint.lintFiles call only
receives lintable paths. Part of #706.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Wire stylelint

**Files:**
- Modify: `packages/vite-plugin-checker/src/checkers/stylelint/main.ts` (only the watcher section)

**Quirk:** `stylelint.lint({ files })` accepts an array; we pass the absolute-path array from the scheduler. No config-file branch, no pre-filter.

- [ ] **Step 1: Replace the watcher wiring in `configureServer`**

Open `packages/vite-plugin-checker/src/checkers/stylelint/main.ts`. Add imports:

```ts
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import { createLintScheduler } from '../_shared/lintScheduler.js'
```

Add a constant after the imports:

```ts
const DEBOUNCE_MS = 300
```

Replace the block from `const handleFileChange = async (` (currently line 95) through the end of the two `watcher.on(...)` calls (currently line 150) with:

```ts
      const scheduler = createLintScheduler({
        debounceMs: DEBOUNCE_MS,
        onBatch: async (files) => {
          const { results } = await stylelint.lint({
            ...baseConfig,
            files,
          })
          const newDiagnostics = results.flatMap((d) =>
            normalizeStylelintDiagnostic(d),
          )
          applyBatchedDiagnostics(manager, files, newDiagnostics, root)
          dispatchDiagnostics()
        },
      })

      // initial lint
      const { results: diagnostics } = await stylelint.lint({
        ...baseConfig,
        ...pluginConfig.stylelint.dev?.overrideConfig,
      })

      manager.initWith(
        diagnostics.flatMap((p) => normalizeStylelintDiagnostic(p)),
      )
      dispatchDiagnostics()

      // watch lint
      let watchTarget: string | string[] = root
      if (pluginConfig.stylelint.watchPath) {
        if (Array.isArray(pluginConfig.stylelint.watchPath)) {
          watchTarget = pluginConfig.stylelint.watchPath.map((p) =>
            path.resolve(root, p),
          )
        } else {
          watchTarget = path.resolve(root, pluginConfig.stylelint.watchPath)
        }
      }

      const watcher = chokidar.watch(watchTarget, {
        cwd: root,
        ignored: createIgnore(root, translatedOptions.files),
      })

      watcher.on('change', (filePath) => {
        scheduler.schedule(path.resolve(root, filePath))
      })
      watcher.on('unlink', (filePath) => {
        const absPath = path.resolve(root, filePath)
        manager.updateByFileId(absPath, [])
        dispatchDiagnostics()
      })
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run stylelint playground e2e**

```bash
pnpm -r --filter='./packages/**' run build
pnpm test-serve -- playground/stylelint-default
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add packages/vite-plugin-checker/src/checkers/stylelint/main.ts
git commit -m "$(cat <<'EOF'
feat(stylelint): route watcher events through lint scheduler

Debounces and coalesces stylelint runs. stylelint.lint({ files })
accepts an array, so the batched call is a drop-in replacement for
the per-file version. Part of #706.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Full verification

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test
```

Expected: unit tests, serve e2e, and build e2e all pass.

- [ ] **Step 2: Run biome check**

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 3: Run publint**

```bash
pnpm publint
```

Expected: clean.

- [ ] **Step 4: Manual smoke test (optional but recommended)**

In a playground like `playground/oxlint-default` or a local consumer project, reproduce the burst from issue #706:

```bash
cd playground/oxlint-default
pnpm dev &
DEV_PID=$!
# In another terminal:
for f in $(ls src/*.tsx | head -5); do echo "// $(date +%s)" >> $f & done; wait
# Observe ps -ax | grep oxlint — should see at most one oxlint process.
kill $DEV_PID
```

Expected: at most one concurrent `oxlint` subprocess, where before there would have been N.

- [ ] **Step 5: Confirm scope**

```bash
git log --oneline main..HEAD
```

Expected: six feature commits (one helper + one primitive + four wirings), all scoped to `packages/vite-plugin-checker/src/checkers/_shared/` and the four checker directories. No unrelated changes.

---

## Notes for the implementer

- **No `scheduler.dispose()` callsite wiring.** None of the four checkers currently close their chokidar watcher on Vite shutdown, and the spec explicitly declines to introduce new shutdown hooks as part of this change. The scheduler's `dispose()` exists for the contract and is covered by unit tests; it is not invoked anywhere in the checker wirings.
- The `_shared/` directory is new. TypeScript and the bundler pick it up automatically; no tsconfig or bundler change needed.
- `normalizePath` is imported from `../../sources.js` in both new helpers — match the `.js` suffix convention used throughout this codebase for ESM TypeScript imports.
- Biome formatting runs via the pre-commit hook (`simple-git-hooks` + `lint-staged` + `biome check --write`). Don't bypass it; if formatting fails, fix and re-commit.
- If `pnpm test-serve` hangs on a single playground, check the `ignored` predicate in that checker's watcher — a symlink loop into `node_modules` can recur. Unrelated to this change, but a known edge.
- If one of the per-checker wirings fails its e2e, the most likely cause is a path-resolution mismatch between what chokidar emits and what the linter expects. Log `files` inside `onBatch` and inspect; if the linter returns a diagnostic whose `id` doesn't match the batch path even after `normalizePath`, the fix belongs in the checker's `NormalizedDiagnostic.id` construction, not in `applyBatchedDiagnostics`.
