import { describe, expect, it } from 'vitest'

import { getHmrOverlay, isServe, sleepForServerReady } from '../../testUtils'

describe('config-overlay-false', () => {
  describe.runIf(isServe)('serve', async () => {
    it('should not find overlay', async () => {
      await sleepForServerReady()
      expect(await getHmrOverlay()).toBeNull()
    })
  })
})
