import type {
  CheckerEvent,
  CheckerState,
  CheckerStatus,
  Diagnostic,
} from './protocol.js'

export interface CheckerStore {
  register(id: string, label: string): void
  setStatus(id: string, status: CheckerStatus, error?: string): void
  /** Replace every diagnostic of a checker and record a finished run. */
  setDiagnostics(id: string, diagnostics: Diagnostic[]): void
  getState(): CheckerState[]
  subscribe(listener: (event: CheckerEvent) => void): () => void
  clear(): void
}

export function createCheckerStore(now = Date.now): CheckerStore {
  const checkers = new Map<string, CheckerState>()
  const filesByChecker = new Map<string, Map<string, string>>()
  const listeners = new Set<(event: CheckerEvent) => void>()

  const emit = (event: CheckerEvent) => {
    for (const listener of listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('[vite-plugin-checker] listener failed:', error)
      }
    }
  }

  const setStatus = (
    id: string,
    requested: CheckerStatus,
    error?: string,
    force = false,
  ) => {
    const state = checkers.get(id)
    if (!state) return

    const running = state.status === 'checking' || state.status === 'starting'
    const status =
      requested === 'checking' && state.status === 'starting'
        ? 'starting'
        : requested
    const nextError = status === 'failed' ? error : undefined
    const firstStart = status === 'starting' && !state.lastRun
    if (
      !force &&
      !firstStart &&
      state.status === status &&
      state.error === nextError
    ) {
      return
    }

    if (status === 'checking' || firstStart) {
      state.lastRun = { startedAt: now() }
    } else if (status === 'idle' || status === 'failed') {
      const finishedAt = now()
      state.lastRun = {
        startedAt:
          running && state.lastRun ? state.lastRun.startedAt : finishedAt,
        finishedAt,
      }
    }

    state.status = status
    if (nextError === undefined) delete state.error
    else state.error = nextError

    emit({
      type: 'status',
      checkerId: id,
      status,
      ...(nextError === undefined ? {} : { error: nextError }),
      ...(state.lastRun ? { lastRun: { ...state.lastRun } } : {}),
    })
  }

  return {
    register(id, label) {
      if (checkers.has(id)) return
      checkers.set(id, { id, label, status: 'starting', diagnostics: [] })
      filesByChecker.set(id, new Map())
    },

    setStatus: (id, status, error) => setStatus(id, status, error),

    setDiagnostics(id, diagnostics) {
      const state = checkers.get(id)
      const previous = filesByChecker.get(id)
      if (!state || !previous) return

      const grouped = new Map<string, Diagnostic[]>()
      for (const diagnostic of diagnostics) {
        const key = diagnostic.file ?? ''
        const bucket = grouped.get(key)
        if (bucket) bucket.push(diagnostic)
        else grouped.set(key, [diagnostic])
      }

      const files: Record<string, Diagnostic[]> = {}
      const next = new Map<string, string>()
      for (const [key, bucket] of grouped) {
        const serialized = JSON.stringify(bucket)
        next.set(key, serialized)
        if (previous.get(key) !== serialized) files[key] = bucket
      }
      for (const key of previous.keys()) {
        if (!next.has(key)) files[key] = []
      }

      filesByChecker.set(id, next)
      state.diagnostics = diagnostics

      if (Object.keys(files).length) {
        emit({ type: 'update', checkerId: id, files })
      }
      setStatus(id, 'idle', undefined, true)
    },

    getState() {
      return [...checkers.values()].map((state) => ({
        ...state,
        diagnostics: [...state.diagnostics],
        ...(state.lastRun ? { lastRun: { ...state.lastRun } } : {}),
      }))
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    clear() {
      checkers.clear()
      filesByChecker.clear()
    },
  }
}
