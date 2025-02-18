import { type Stats, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import zeptomatch from 'zeptomatch'

export function createIgnore(root: string, pattern: string | string[] = []) {
  const paths = Array.isArray(pattern) ? pattern : [pattern]

  const globs = paths.flatMap((f) => {
    const resolvedPath = resolve(root, f)
    const relativePath = relative(root, resolve(root, f))
    try {
      const isDirectory =
        !relativePath.includes('*') && statSync(resolvedPath).isDirectory()
      if (isDirectory) {
        return [relativePath, join(relativePath, '**/*')]
      }
    } catch {}
    return [relativePath]
  })

  return (path: string, _stats?: Stats) =>
    path.includes('node_modules') ||
    (path !== root &&
      !zeptomatch(globs, relative(root, path)) &&
      !(_stats ?? statSync(path)).isDirectory())
}
