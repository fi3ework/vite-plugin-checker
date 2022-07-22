import { isServe, getHmrOverlayText, sleepForServerReady } from '../../testUtils'
import { describe, expect, it } from 'vitest'

describe('overlay-false', () => {
  it('serve', async () => {
    describe.runIf(isServe)('serve', async () => {
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
