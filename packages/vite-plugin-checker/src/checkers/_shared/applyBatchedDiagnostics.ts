import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { normalizePath } from '../../sources.js'

/**
 * Bucket a flat diagnostic list by file and write per-file diagnostics
 * to the manager. Every file in `scannedFiles` is written (empty list
 * clears stale diagnostics). Files not in `scannedFiles` are untouched.
 *
 * Paths are normalized via `sources.ts#normalizePath(root)` on both sides
 * before keying to defend against checker normalizers that differ in
 * casing, separators, or unresolved `.` segments.
 */
export function applyBatchedDiagnostics(
  manager: FileDiagnosticManager,
  scannedFiles: string[],
  diagnostics: NormalizedDiagnostic[],
  root: string,
): void {
  const byFile = new Map<string, NormalizedDiagnostic[]>()
  for (const d of diagnostics) {
    if (!d.id) continue // stylelint stdin or malformed entries
    const key = normalizePath(d.id, root)
    const normalized = { ...d, id: key }
    const bucket = byFile.get(key)
    if (bucket) {
      bucket.push(normalized)
    } else {
      byFile.set(key, [normalized])
    }
  }

  for (const file of scannedFiles) {
    const key = normalizePath(file, root)
    manager.updateByFileId(key, byFile.get(key) ?? [])
  }
}
