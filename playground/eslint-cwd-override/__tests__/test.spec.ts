import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  isServe,
  resetReceivedLog,
  sleepForServerReady,
  stripedLog,
  waitForDiagnostics,
} from '../../testUtils'

describe('eslint-cwd-override', () => {
  describe.runIf(isServe)('serve', () => {
    it('lints changed files when eslint cwd differs from vite root', async () => {
      await sleepForServerReady()
      expect(diagnostics).toHaveLength(1)
      expect(stripedLog.join('\n')).toContain('Missing semicolon')

      resetReceivedLog()
      editFile('src/index.js', (code) => `${code}const b = "world"\n`)
      await waitForDiagnostics()
      expect(diagnostics).toHaveLength(2)
      expect(stripedLog.join('\n')).toContain('Missing semicolon')
    })
  })
})
