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
          'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
        )
      }
    })
  })
})
