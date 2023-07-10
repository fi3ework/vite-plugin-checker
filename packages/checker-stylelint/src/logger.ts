import type Stylelint from 'stylelint'
import type { NormalizedDiagnostic, SourceLocation } from 'vite-plugin-checker/logger'
import { DiagnosticLevel } from 'vite-plugin-checker/types'
import { createFrame, strip, isNormalizedDiagnostic } from 'vite-plugin-checker/logger'

export function normalizeStylelintDiagnostic(
  diagnostic: Stylelint.LintResult
): NormalizedDiagnostic[] {
  return (
    diagnostic.warnings
      // @ts-ignore
      .map((d) => {
        let level = DiagnosticLevel.Error
        switch (d.severity) {
          case 'warning': // warn
            level = DiagnosticLevel.Warning
            break
          case 'error': // error
            level = DiagnosticLevel.Error
            break
          default:
            level = DiagnosticLevel.Error
            return null
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
          // @ts-ignore
          source: diagnostic._postcssResult.css ?? '',
          location: loc,
        })

        return {
          message: `${d.text} (${d.rule})`,
          conclusion: '',
          codeFrame,
          stripedCodeFrame: codeFrame && strip(codeFrame),
          id: diagnostic.source,
          checker: 'Stylelint',
          loc,
          level,
        } as any as NormalizedDiagnostic
      })
      .filter(isNormalizedDiagnostic)
  )
}
