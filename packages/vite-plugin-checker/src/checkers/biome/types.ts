export interface BiomeOutput {
  summary: {
    changed: number
    unchanged: number
    duration: {
      secs: number
      nanos: number
    }
    errors: number
    warnings: number
    skipped: number
    suggestedFixesSkipped: number
    diagnosticsNotPrinted: number
  }
  diagnostics: Array<{
    category: string
    severity: string
    description: string
    message: Array<{
      elements: Array<any>
      content: string
    }>
    advices: {
      advices: Array<{
        diff?: {
          dictionary: string
          ops: Array<{
            diffOp?: {
              equal?: {
                range: Array<number>
              }
              delete?: {
                range: Array<number>
              }
              insert?: {
                range: Array<number>
              }
            }
            equalLines?: {
              line_count: number
            }
          }>
        }
        log?: [
          string,
          Array<{
            elements: Array<any>
            content: string
          }>
        ]
      }>
    }
    verboseAdvices: {
      advices: Array<any>
    }
    location: {
      path: {
        file: string
      }
      span?: Array<number>
      sourceCode?: string
    }
    tags: Array<any>
    source: any
  }>
  command: string
}
