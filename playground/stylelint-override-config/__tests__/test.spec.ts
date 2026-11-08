import { describe, expect, it } from 'vitest'
import { diagnostics, editFile, isServe, waitForServerReady, waitForDiagnostics } from '../../testUtils'

describe('stylelint-override-config', () => {
  describe.runIf(isServe)('serve', () => {
    it('applies `dev.overrideConfig` when re-linting changed files', async () => {
      await waitForServerReady()
      expect(diagnostics).toHaveLength(0)

      editFile('src/style.css', (code) => code.replace('rgb(0 0 0)', '#000'))
      await waitForDiagnostics()
      expect(diagnostics.map((d) => d.code)).toEqual(['color-no-hex'])
    })
  })
})
