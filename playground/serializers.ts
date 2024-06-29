import type { SnapshotSerializer } from 'vitest'

function normalizePaths(val: string) {
  return val
    .replace(/\\/gim, '/') // replace slashes
    .replace(/\/\//gim, '/') // replace slashes
    .replace(/[a-zA-Z]:\//gim, '/') // Remove win32 drive letters, C:\ -> \
}

function createResult(val: string) {
  const cwd = normalizePaths(process.cwd())

  return normalizePaths(val)
    .replaceAll(cwd, '<PROJECT_ROOT>')
    .replace(/\/r\/n/gim, '/n')
}

export const normalizeLogSerializer: SnapshotSerializer = {
  print(val: string, print) {
    console.log('normalizeLogSerializer: print')
    return print(createResult(val))
  },
  test(val) {
    console.log('normalizeLogSerializer: test')
    return typeof val === 'string' && val && createResult(val) !== val
  },
}
