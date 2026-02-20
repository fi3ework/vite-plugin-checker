import { describe, expect, it } from 'vitest'

import { getHmrOverlayText, isServe, sleepForServerReady } from '../../testUtils'

describe('config-initialIsOpen-false', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not find overlay', async () => {
      if (isServe) {
        await sleepForServerReady()
        try {
          await getHmrOverlayText()
        } catch (e) {
          expect((e as any).toString()).toContain(
            'Invariant failed: .message-body is expected in shadow root'
          )
        }
      }
    })
  })
})
