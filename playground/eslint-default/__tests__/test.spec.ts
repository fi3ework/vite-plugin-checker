import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  editFileTo,
  expectStderrContains,
  hasDiagnosticFor,
  isBuild,
  isServe,
  log,
  removeFile,
  resetReceivedLog,
  sleepForServerReady,
  stripedLog,
  waitForDiagnostics,
} from '../../testUtils'

describe('eslint-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit error file --')
      resetReceivedLog()
      editFile('src/main.ts', (code) => code.replace(`'Hello'`, `'Hello~'`))
      await waitForDiagnostics()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit non error file --')
      resetReceivedLog()
      editFile('src/text.ts', (code) => code.replace(`Vanilla`, `vanilla`))
      await waitForDiagnostics()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('lints added files and clears removed ones', async () => {
      await sleepForServerReady()

      editFileTo('src/added.ts', 'export var added = 1\n')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.ts')).toBe(true)

      removeFile('src/added.ts')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.ts')).toBe(false)
    })
  })

  describe.runIf(isBuild)('build', () => {
    const expectedMsg = 'Unexpected var, use let or const instead'

    it('should fail', async () => {
      expectStderrContains(log, expectedMsg)
    })
  })
})
