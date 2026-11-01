import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  editFile,
  expectStderrContains,
  isBuild,
  isServe,
  log,
  resetReceivedLog,
  sleepForServerReady,
  stripedLog,
  waitForDiagnostics,
} from '../../testUtils'

describe('vue-tsc-solution', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady(2)
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('src/App.vue', (code) =>
        code.replace("'not a number'", "'still not a number'"),
      )
      await waitForDiagnostics()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      expectStderrContains(log, 'error TS2322')
    })
  })
})
