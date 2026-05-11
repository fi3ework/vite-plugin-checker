import fs from 'node:fs/promises'
import path from 'node:path'

export function normalizePath(p: string, cwd: string) {
  let filename = p
  // Strip file:// URL scheme (oxlint outputs file:// URLs in JSON format)
  if (filename && filename.startsWith("file://")) {
    filename = filename.slice(7);
  }
  if (filename) {
    filename = path.isAbsolute(filename)
      ? filename
      : path.resolve(cwd, filename)
    filename = path.normalize(filename)
  }

  return filename
}

export async function readSources(files: string[]) {
  const cache = new Map<string, string>()
  await Promise.all(
    files.map(async (file) => {
      try {
        const source = await fs.readFile(file, 'utf8')
        cache.set(file, source)
      } catch {
        // Ignore unreadable files; related diagnostics will be skipped.
      }
    }),
  )
  return cache
}
