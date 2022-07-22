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

describe('overlay-terminal-false', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })
})
