import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  isServe,
  resetDiagnostics,
  sleepForServerReady,
  waitForDiagnostics,
} from '../../testUtils'

describe('eslint-suppressions', () => {
  describe.runIf(isServe)('serve', () => {
    it('does not report errors that are suppressed', async () => {
      await sleepForServerReady()
      expect(diagnostics).toHaveLength(0)

      resetDiagnostics()
      editFile('src/index.js', (code) => `${code}\nconst b = "world"`)
      await waitForDiagnostics()

      expect(diagnostics).toHaveLength(2)
    })
  })
})
