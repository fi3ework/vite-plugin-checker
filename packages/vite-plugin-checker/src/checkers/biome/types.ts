export interface BiomeOutput {
  diagnostics: Diagnostic[]
}

// ── Biome >=2.4 (modern schema) ────────────────────────────────────

interface ModernPosition {
  line: number
  column: number
}

interface ModernLocation {
  path: string
  start: ModernPosition
  end: ModernPosition
}

interface ModernAdvice {
  start: ModernPosition
  end: ModernPosition
  text: string
}

export interface ModernDiagnostic {
  severity: 'hint' | 'info' | 'warning' | 'error' | 'fatal'
  message: string
  category?: string
  location?: ModernLocation
  advices: ModernAdvice[]
}

// ── Biome <2.4 (legacy schema) ─────────────────────────────────────

type LegacyTextRange = [number, number]

interface LegacyLocation {
  path?: { file: string }
  sourceCode?: string
  span?: LegacyTextRange
}

export interface LegacyDiagnostic {
  severity: 'hint' | 'information' | 'warning' | 'error' | 'fatal'
  description: string
  category?: string
  location: LegacyLocation
  // fields present but unused by the plugin
  message?: unknown
  advices?: unknown
  tags?: unknown
  source?: unknown
  verboseAdvices?: unknown
}

// ── Discriminated union ─────────────────────────────────────────────

export type Diagnostic = ModernDiagnostic | LegacyDiagnostic
