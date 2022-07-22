import type { NormalizedDiagnostic } from './logger.js'

class FileDiagnosticManager {
  public diagnostics: NormalizedDiagnostic[] = []
  private initialized = false

  /**
   * Only used when initializing the manager
   */
  public initWith(diagnostics: NormalizedDiagnostic[]) {
    if (this.initialized) {
      throw new Error('FileDiagnosticManager is already initialized')
    }

    diagnostics.forEach((d) => {
      this.diagnostics.push(d)
    })

    this.initialized = true
  }

  public getDiagnostics(fileName?: string) {
    if (fileName) {
      return this.diagnostics.filter((f) => f.id === fileName)
    }

    return this.diagnostics
  }

  public updateByFileId(fileId: string, next: NormalizedDiagnostic[] | null) {
    for (let i = 0; i < this.diagnostics.length; i++) {
      if (this.diagnostics[i].id === fileId) {
        this.diagnostics.splice(i, 1)
        i--
      }
    }

    if (next?.length) {
      this.diagnostics.push(...next)
    }
  }
}

export { FileDiagnosticManager }
