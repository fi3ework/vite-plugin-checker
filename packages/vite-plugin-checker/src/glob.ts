import { type Stats, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import zeptomatch from 'zeptomatch'

export function createIgnore(root: string, pattern: string | string[] = []) {
  const paths = Array.isArray(pattern) ? pattern : [pattern]

  const globs = paths.flatMap((f) => {
    const resolvedPath = resolve(root, f).replace(/\\/g, '/')
    const relativePath = relative(root, resolvedPath)
    try {
      const isDirectory =
        !relativePath.includes('*') && statSync(resolvedPath).isDirectory()
      if (isDirectory) {
        return [relativePath, join(relativePath, '**/*')]
      }
    } catch {}
    return [relativePath]
  })

  return (path: string, _stats?: Stats) => {
    return (
      path.includes('node_modules') ||
      (path !== root &&
        !zeptomatch(globs, relative(root, path).replace(/\\/g, '/')) &&
        !(_stats ?? statSync(path)).isDirectory())
    )
  }
}
