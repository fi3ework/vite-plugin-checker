import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function normalizePath(p: string, cwd: string) {
  let filename = p
  // Decode file URLs, including escaped characters and platform-specific paths.
  if (filename.startsWith('file://')) {
    filename = fileURLToPath(filename)
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
