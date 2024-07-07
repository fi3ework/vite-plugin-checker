import type { NormalizedDiagnostic } from './logger.js'

class FileDiagnosticManager {
  public diagnostics: NormalizedDiagnostic[] = []

  /**
   * Initialize and reset the diagnostics array
   */
  public initWith(diagnostics: NormalizedDiagnostic[]) {
    this.diagnostics = [...diagnostics]
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
