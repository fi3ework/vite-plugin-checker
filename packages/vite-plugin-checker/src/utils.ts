import { isMainThread as _isMainThread, threadId } from 'node:worker_threads'

// since vitest run all cases in worker thread, we should compatible with it to pass E2E tests

// @ts-expect-error use Vitest
export const isInVitestEntryThread = threadId === 0 && process.env.VITEST
export const isMainThread = _isMainThread || isInVitestEntryThread

// Filesystem errors that are expected during watching: editors commonly save
// via an atomic rename (write temp file, then replace), and branch switches or
// deletions can remove a file between a watcher event firing and the checker
// reading it. In that window the path briefly doesn't exist (or isn't readable
// yet), so a `change`/`unlink` handler can hit one of these codes. They are
// transient and should not crash the dev server — the next stable write fires a
// fresh event. See #461 for the same race in the ignore-check path.
const TRANSIENT_FS_ERROR_CODES = new Set(['ENOENT', 'EBUSY', 'EPERM', 'EACCES'])

export function isTransientFsError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { code } = error as NodeJS.ErrnoException
  return code !== undefined && TRANSIENT_FS_ERROR_CODES.has(code)
}

// `.catch` handler for watcher-triggered checker work. Ignore the transient FS
// errors that happen when a file is removed/replaced mid-read, and rethrow
// anything else so genuine failures still surface instead of being hidden.
export function ignoreTransientFsError(error: unknown): void {
  if (isTransientFsError(error)) return
  throw error
}
