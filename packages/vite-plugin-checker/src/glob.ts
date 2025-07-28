import { type Stats, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import picomatch from 'picomatch'

export function createIgnore(_root: string, pattern: string | string[] = []) {
  const paths = Array.isArray(pattern) ? pattern : [pattern]
  const root = _root.replace(/\\/g, '/')

  const globs = paths
    .flatMap((f) => {
      const resolvedPath = resolve(root, f)
      const relativePath = relative(root, resolvedPath).replace(/\\/g, '/')
      try {
        const isDirectory =
          !relativePath.includes('*') && statSync(resolvedPath).isDirectory()
        if (isDirectory) {
          return [relativePath, join(relativePath, '**/*').replace(/\\/g, '/')]
        }
      } catch {}
      return [relativePath]
    })
    .filter(Boolean)

  const matcher = picomatch(globs, { cwd: root })

  return (path: string, _stats?: Stats) => {
    if (path.includes('node_modules')) {
      return true
    }
    const relativePath = relative(root, path).replace(/\\/g, '/')
    try {
      return (
        !!relativePath &&
        !matcher(relativePath) &&
        !(_stats ?? statSync(path)).isDirectory()
      )
    } catch {
      // do not ignore files that have been deleted as the watcher is iterating on them
      return false
    }
  }
}
