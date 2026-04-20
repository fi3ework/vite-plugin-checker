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
  // Tracks the raw onBatch promise so dispose() waits on it with minimal indirection.
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
