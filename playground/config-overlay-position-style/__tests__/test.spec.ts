import { describe, expect, it } from 'vitest'
import { getOverlayBadge, getOverlayPage, isServe, page, sleepForServerReady } from '../../testUtils'

describe('config-overlay-position-style', () => {
  describe.runIf(isServe)('serve', () => {
    it('opens the drawer along the top edge and themes it with `--mb-*` properties', async () => {
      await sleepForServerReady()
      await getOverlayPage().locator('.diagnostic').first().waitFor({ timeout: 10_000 })
      const drawer = page.locator('vite-plugin-checker-overlay .drawer')

      const { top, bgColor } = await drawer.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return { top: style.top, bgColor: style.backgroundColor }
      })
      expect(top).toBe('12px')
      expect(bgColor).toBe('rgb(164, 193, 255)')
    })

    it('puts the badge in the top right corner and lets `::part(badge)` restyle it', async () => {
      await sleepForServerReady()
      await page.locator('vite-plugin-checker-overlay .close').click()
      const badge = getOverlayBadge()
      await badge.waitFor()

      const { top, right, bgColor } = await badge.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return { top: style.top, right: style.right, bgColor: style.backgroundColor }
      })
      expect(top).toBe('12px')
      expect(right).toBe('12px')
      expect(bgColor).toBe('rgb(231, 153, 176)')
    })
  })
})
