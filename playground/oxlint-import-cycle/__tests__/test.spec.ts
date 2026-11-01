import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFileTo,
  hasDiagnosticFor,
  isServe,
  resetDiagnostics,
  sleepForServerReady,
  waitForDiagnostics,
} from '../../testUtils'

describe('oxlint-import-cycle', () => {
  describe.runIf(isServe)('serve', () => {
    it('updates diagnostics in files affected by a change to another file', async () => {
      await sleepForServerReady()
      expect(diagnostics).toHaveLength(0)

      editFileTo('src/b.ts', "import { a } from './a'\n\nexport const b = a\n")
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/a.ts')).toBe(true)
      expect(hasDiagnosticFor('src/b.ts')).toBe(true)

      resetDiagnostics()
      editFileTo('src/a.ts', 'export const a = 1\n')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/a.ts')).toBe(false)
      expect(hasDiagnosticFor('src/b.ts')).toBe(false)
    })
  })
})
