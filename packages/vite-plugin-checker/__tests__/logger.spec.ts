import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters as strip } from 'node:util'
import type Stylelint from 'stylelint'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setTerminalColors } from '../src/colors'
import {
  diagnosticToTerminalLog,
  normalizeEslintDiagnostic,
  normalizeStylelintDiagnostic,
  setTerminalHyperlinks,
} from '../src/logger'
import {
  error1 as eslintError1,
  eslintResult1,
  warning1 as eslintWarning1,
} from './fixtures/eslintDiagnostic'

const projectRoot = '/Users/vite-plugin-checker/playground/eslint'

describe('logger', () => {
  beforeEach(() => {
    setTerminalColors(false)
  })

  describe('diagnosticToTerminalLog', () => {
    beforeEach(() => {
      vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      setTerminalHyperlinks(false)
    })

    it('get error', () => {
      const received = strip(diagnosticToTerminalLog(eslintError1, 'ESLint'))
      expect(received.replaceAll('\\', '/')).toMatchSnapshot()
    })

    it('get warning', () => {
      const received = strip(diagnosticToTerminalLog(eslintWarning1, 'ESLint'))
      expect(received.replaceAll('\\', '/')).toMatchSnapshot()
    })

    it('links the file path when hyperlinks are enabled', () => {
      setTerminalHyperlinks(true)
      const received = diagnosticToTerminalLog(eslintError1, 'ESLint')
      const url = `${pathToFileURL(eslintError1.id!).href}#L3,1`
      expect(received).toContain(`\u001B]8;;${url}\u0007`)
    })

    it('does not link the file path when hyperlinks are disabled', () => {
      const received = diagnosticToTerminalLog(eslintError1, 'ESLint')
      expect(received).not.toContain('\u001B]8;')
    })

    it('links the rule to its docs when hyperlinks are enabled', () => {
      setTerminalHyperlinks(true)
      const received = diagnosticToTerminalLog(
        {
          ...eslintError1,
          message: 'Unexpected var, use let or const instead. (no-var)',
          rule: 'no-var',
          ruleUrl: 'https://eslint.org/docs/latest/rules/no-var',
        },
        'ESLint',
      )
      expect(received).toContain(
        'instead. (\u001B]8;;https://eslint.org/docs/latest/rules/no-var\u0007no-var\u001B]8;;\u0007)',
      )
    })

    it('omits the file line when the diagnostic has no file', () => {
      const received = strip(
        diagnosticToTerminalLog({ ...eslintError1, id: undefined }, 'ESLint'),
      )
      expect(received).not.toContain('FILE')
    })
  })

  describe('normalizeEslintDiagnostic', () => {
    it('get multiple diagnostics', () => {
      const received = normalizeEslintDiagnostic(eslintResult1)
      expect(received).toMatchSnapshot()
    })

    it('adds the rule docs URL from rule metadata', () => {
      const [diagnostic] = normalizeEslintDiagnostic(eslintResult1, {
        'no-var': {
          docs: { url: 'https://eslint.org/docs/latest/rules/no-var' },
        },
      })
      expect(diagnostic!.rule).toBe('no-var')
      expect(diagnostic!.ruleUrl).toBe(
        'https://eslint.org/docs/latest/rules/no-var',
      )
    })
  })

  describe('normalizeStylelintDiagnostic', () => {
    it('does not repeat the rule name in the message', () => {
      const [diagnostic] = normalizeStylelintDiagnostic({
        source: '/project/src/style.css',
        warnings: [
          {
            line: 1,
            column: 7,
            rule: 'block-no-empty',
            severity: 'error',
            text: 'Empty block (block-no-empty)',
          },
        ],
      } as unknown as Stylelint.LintResult)
      expect(diagnostic!.message).toBe('Empty block (block-no-empty)')
    })
  })
})
