import { describe, expect, it } from 'vitest'
import strip from 'strip-ansi'

import {
  diagnosticToTerminalLog,
  NormalizedDiagnostic,
  normalizeEslintDiagnostic,
} from '../src/logger'
import {
  error1 as eslintError1,
  warning1 as eslintWarning1,
  eslintResult1,
} from './fixtures/eslintDiagnostic'

describe('logger', () => {
  describe('diagnosticToTerminalLog', () => {
    it('get error', () => {
      const received = strip(diagnosticToTerminalLog(eslintError1, 'ESLint'))
      expect(received).toMatchSnapshot()
    })

    it('get warning', () => {
      const received = strip(diagnosticToTerminalLog(eslintWarning1, 'ESLint'))
      expect(received).toMatchSnapshot()
    })
  })

  describe('normalizeEslintDiagnostic', () => {
    it('get multiple diagnostics', () => {
      const received = normalizeEslintDiagnostic(eslintResult1)
      expect(received).toMatchSnapshot()
    })
  })
})
