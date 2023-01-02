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

describe('backend-integration', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = `TS2345: Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'`
      expectStderrContains(log, expectedMsg)
    })
  })
})
