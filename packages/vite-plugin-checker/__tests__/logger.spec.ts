import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters as strip } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  diagnosticToTerminalLog,
  normalizeEslintDiagnostic,
  setTerminalHyperlinks,
} from '../src/logger'
import {
  error1 as eslintError1,
  eslintResult1,
  warning1 as eslintWarning1,
} from './fixtures/eslintDiagnostic'

const projectRoot = '/Users/vite-plugin-checker/playground/eslint'

describe('logger', () => {
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
  })
})
