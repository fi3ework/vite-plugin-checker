import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import { diagnostics, isServe, waitForServerReady, stripedLog } from '../../testUtils'

describe('config-terminal-false', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not log into terminal', async () => {
      await waitForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })
})
