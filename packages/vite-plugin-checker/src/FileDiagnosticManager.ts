import type { NormalizedDiagnostic } from './logger.js'

class FileDiagnosticManager {
  public diagnostics: NormalizedDiagnostic[] = []

  /**
   * Resets the diagnostics array
   */
  public initWith(diagnostics: NormalizedDiagnostic[]) {
    if (this.initialized) {
      throw new Error('FileDiagnosticManager is already initialized')
    }

    this.diagnostics = [...diagnostics]
    this.initialized = true
  }

  public getDiagnostics(fileName?: string) {
    if (fileName) {
      return this.diagnostics.filter((f) => f.id === fileName)
    }

    return this.diagnostics
  }

  public updateByFileId(fileId: string, next: NormalizedDiagnostic[] | null) {
    this.diagnostics = this.diagnostics.filter((d) => d.id !== fileId)

    if (next?.length) {
      this.diagnostics.push(...next)
    }
  }
}

export { FileDiagnosticManager }
