export interface BiomeOutput {
  diagnostics: Diagnostic[]
}

type Severity = 'hint' | 'info' | 'warning' | 'error' | 'fatal'

export interface Diagnostic {
  severity: Severity
  message: string
  category?: string
  location?: Location
  advices: Advice[]
}

interface Position {
  line: number
  column: number
}

interface Location {
  path: string
  start: Position
  end: Position
}

interface Advice {
  start: Position
  end: Position
  text: string
}
