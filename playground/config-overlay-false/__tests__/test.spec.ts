import { describe, expect, it } from 'vitest'

import { getHmrOverlayText, isServe, sleepForServerReady } from '../../testUtils'

describe('config-overlay-false', () => {
  describe.runIf(isServe)('serve', async () => {
    it('should not find overlay', async () => {
      await sleepForServerReady()
      try {
        await getHmrOverlayText()
      } catch (e) {
        await expect((e as any).toString()).toContain(
          'Error: Invariant failed: .message-body is expected in shadow root'
        )
      }
    })
  })
})
