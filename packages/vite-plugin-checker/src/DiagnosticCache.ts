import type { NormalizedDiagnostic } from './logger'

class FileDiagnosticCache {
  public diagnostics: NormalizedDiagnostic[] = []

  public initWith(diagnostics: NormalizedDiagnostic[]) {
    diagnostics.forEach((d) => {
      this.diagnostics.push(d)
    })
  }

  public getDiagnostics(fileName?: string) {
    if (fileName) {
      return this.diagnostics.filter((f) => f.id === fileName)
    }

    return this.diagnostics
  }

  public get lastDiagnostic() {
    return this.diagnostics[this.diagnostics.length - 1]
  }

  public setFile(fileName: string, next: NormalizedDiagnostic[] | null) {
    for (let i = 0; i < this.diagnostics.length; i++) {
      if (this.diagnostics[i].id === fileName) {
        this.diagnostics.splice(i, 1)
        i--
      }
    }

    if (next?.length) {
      this.diagnostics.push(...next)
    }
  }
}

export { FileDiagnosticCache }
