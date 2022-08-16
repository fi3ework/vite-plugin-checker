import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  expectStderrContains,
  isBuild,
  isServe,
  log,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('config-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = 'Unexpected var, use let or const instead  no-var'
      expectStderrContains(log, expectedMsg)
    })
  })
})
