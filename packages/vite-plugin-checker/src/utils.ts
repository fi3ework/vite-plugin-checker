import { isMainThread as _isMainThread, threadId } from 'node:worker_threads'

// since vitest run all cases in worker thread, we should compatible with it to pass E2E tests

// @ts-expect-error use Vitest
export const isInVitestEntryThread = threadId === 0 && process.env.VITEST
export const isMainThread = _isMainThread || isInVitestEntryThread
