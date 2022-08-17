import { isMainThread as _isMainThread, threadId } from 'worker_threads'

// since vitest run all cases in worker thread, we should compatible with it to pass E2E tests
export const isInVitestEntryThread = threadId === 1 && process.env['VITEST']
export const isMainThread = _isMainThread || isInVitestEntryThread
