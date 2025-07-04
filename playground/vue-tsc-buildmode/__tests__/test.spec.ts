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
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('vue-tsc-build-mode', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady(2)
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('packages/utils/src/helpers.ts', (code) =>
        code.replace('processData(input: number)', 'processData(input: boolean)')
      )
      await sleepForEdit(2)
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = `error TS2345`
      expectStderrContains(log, expectedMsg)
    })
  })
})
