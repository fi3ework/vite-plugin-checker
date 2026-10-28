import { readdirSync } from 'node:fs'
import path from 'node:path'
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'

/**
 * Clear diagnostics for files that no longer exist on disk. File names are
 * matched exactly, so a case-only rename on a case-insensitive file system
 * also clears diagnostics keyed by the old name.
 */
export function pruneMissingFiles(manager: FileDiagnosticManager): void {
  const entriesByDir = new Map<string, Set<string> | null>()
  const ids = new Set(manager.getDiagnostics().map((d) => d.id))

  for (const id of ids) {
    if (!id) continue
    const dir = path.dirname(id)
    let entries = entriesByDir.get(dir)
    if (entries === undefined) {
      try {
        entries = new Set(readdirSync(dir))
      } catch {
        entries = null
      }
      entriesByDir.set(dir, entries)
    }
    if (!entries?.has(path.basename(id))) {
      manager.updateByFileId(id, [])
    }
  }
}
