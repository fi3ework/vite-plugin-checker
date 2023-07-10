import type { ESLint } from 'eslint'
import { createFrame, strip, isNormalizedDiagnostic } from 'vite-plugin-checker/logger'
import type { NormalizedDiagnostic, SourceLocation } from 'vite-plugin-checker/logger'
import { DiagnosticLevel } from 'vite-plugin-checker/types'

export function normalizeEslintDiagnostic(diagnostic: ESLint.LintResult): NormalizedDiagnostic[] {
  return diagnostic.messages
    .map((d) => {
      let level = DiagnosticLevel.Error
      switch (d.severity) {
        case 0: // off, ignore this
          level = DiagnosticLevel.Error
          return null
        case 1: // warn
          level = DiagnosticLevel.Warning
          break
        case 2: // error
          level = DiagnosticLevel.Error
          break
      }

      const loc: SourceLocation = {
        start: {
          line: d.line,
          column: d.column,
        },
        end: {
          line: d.endLine || 0,
          column: d.endColumn,
        },
      }

      const codeFrame = createFrame({
        source: diagnostic.source ?? '',
        location: loc,
      })

      return {
        message: `${d.message} (${d.ruleId})`,
        conclusion: '',
        codeFrame,
        stripedCodeFrame: codeFrame && strip(codeFrame),
        id: diagnostic.filePath,
        checker: 'ESLint',
        loc,
        level,
      } as any as NormalizedDiagnostic
    })
    .filter(isNormalizedDiagnostic)
}
