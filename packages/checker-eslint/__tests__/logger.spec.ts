import { describe, expect, it } from 'vitest'

import { normalizeEslintDiagnostic } from '../src/logger.js'
import { eslintResult1 } from './fixtures/eslintDiagnostic.js'

describe('eslint logger', () => {
  describe('normalizeEslintDiagnostic', () => {
    it('get multiple diagnostics', () => {
      const received = normalizeEslintDiagnostic(eslintResult1)
      expect(received).toMatchSnapshot()
    })
  })
})
