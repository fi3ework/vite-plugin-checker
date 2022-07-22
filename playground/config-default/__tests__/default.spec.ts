import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  expectStderrContains,
  sleepForServerReady,
  diagnostics,
  isBuild,
  isServe,
  log,
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
    it('default', async () => {
      const expectedMsg = 'Unexpected var, use let or const instead  no-var'
      expectStderrContains(log, expectedMsg)
    })
  })
})
