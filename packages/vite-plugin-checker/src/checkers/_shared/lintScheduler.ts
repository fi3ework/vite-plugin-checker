import { existsSync } from 'node:fs'

export const DEFAULT_DEBOUNCE_MS = 300

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
  /** Existence probe, overridable for tests. Defaults to `fs.existsSync`. */
  fileExists?: (filePath: string) => boolean
}

export function createLintScheduler(opts: LintSchedulerOptions): LintScheduler {
  const { debounceMs, onBatch, fileExists = existsSync } = opts

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
    // Drop files deleted inside the debounce window; linting them would fail
    // the whole batch. The watcher's `unlink` handler clears their diagnostics.
    const snapshot = [...pending].filter((f) => fileExists(f))
    pending.clear()
    if (snapshot.length === 0) return

    const raw = onBatch(snapshot)
    inFlight = raw

    raw
      .catch((err) => {
        // One failed lint run must not wedge the checker. Log and continue.
        console.error('[vite-plugin-checker] lint batch failed:', err)
      })
      .then(() => {
        inFlight = null
        drain()
      })
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
      return (inFlight ?? Promise.resolve()).catch(() => {})
    },
  }
}
