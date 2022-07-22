import { describe, expect, it } from 'vitest'

import { isServe, sleepForServerReady, getHmrOverlayText } from '../../testUtils'

describe('initial-is-open-false', () => {
  describe.runIf(isServe)('serve', () => {
    it('default', async () => {
      if (isServe) {
        await sleepForServerReady()
        try {
          await getHmrOverlayText()
        } catch (e) {
          expect((e as any).toString()).toContain(
            'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
          )
        }
      }
    })
  })
})
