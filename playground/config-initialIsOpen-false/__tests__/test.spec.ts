import { describe, expect, it } from 'vitest'

import {
  getHmrOverlayText,
  getOverlayBadge,
  getOverlayFrame,
  isServe,
  waitForServerReady,
} from '../../testUtils'

describe('config-initialIsOpen-false', () => {
  describe.runIf(isServe)('serve', () => {
    it('shows only the badge until it is clicked', async () => {
      await waitForServerReady()
      const badge = getOverlayBadge()
      await badge.waitFor()
      expect(await getOverlayFrame()).toBeNull()

      await badge.click()
      const [message] = await getHmrOverlayText()
      expect(message).toContain('Unexpected var')
    })
  })
})
