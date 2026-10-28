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
  removeFile,
  log,
  resetReceivedLog,
  sleepForServerReady,
  stripedLog,
  waitForDiagnostics,
} from '../../testUtils'

describe('stylelint', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit error file --')
      resetReceivedLog()
      editFile('src/style.css', (code) => code.replace(`color: rgb(0, 0, 0);`, `color: #fff;`))
      await waitForDiagnostics()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('lints added files and clears removed ones', async () => {
      await sleepForServerReady()

      editFileTo('src/added.css', 'a {\n}\n')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.css')).toBe(true)

      removeFile('src/added.css')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.css')).toBe(false)
    })
  })

  describe.runIf(isBuild)('build', () => {
    const expectedMsg = ['Empty block', 'Expected modern color-function notation']

    it('should fail', async () => {
      expectStderrContains(log, expectedMsg)
    })
  })
})
