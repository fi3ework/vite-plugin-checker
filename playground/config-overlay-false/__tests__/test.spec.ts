import { describe, expect, it } from 'vitest'

import { getHmrOverlay, isServe, waitForServerReady } from '../../testUtils'

describe('config-overlay-false', () => {
  describe.runIf(isServe)('serve', async () => {
    it('should not find overlay', async () => {
      await waitForServerReady()
      expect(await getHmrOverlay()).toBeNull()
    })
  })
})
