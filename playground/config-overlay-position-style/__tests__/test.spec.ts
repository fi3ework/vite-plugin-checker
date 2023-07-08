import { sleepForServerReady, getHmrOverlay, isServe } from '../../testUtils'
import { describe, expect, it } from 'vitest'

describe('config-overlay-position-style', () => {
  describe.runIf(isServe)('serve', () => {
    it('find badge in right top corner and customized by badgeStyle', async () => {
      await sleepForServerReady()
      const shadowRoot = await getHmrOverlay()
      const badge = await shadowRoot!.$('.badge-base')

      const { bgColor, top, right } = await badge!.evaluate((el) => {
        const bgColor = window.getComputedStyle(el).getPropertyValue('background-color')
        const top = window.getComputedStyle(el).getPropertyValue('top')
        const right = window.getComputedStyle(el).getPropertyValue('right')
        return { bgColor, top, right }
      })

      expect(bgColor).toBe('rgb(231, 153, 176)')
      expect(top).toBe('0px')
      expect(right).toBe('0px')
    })

    it('panel be customized by panelStyle', async () => {
      await sleepForServerReady()
      const shadowRoot = await getHmrOverlay()
      const panel = await shadowRoot!.$('.window')

      const { bgColor } = await panel!.evaluate((el) => {
        const bgColor = window.getComputedStyle(el).getPropertyValue('background-color')
        return { bgColor }
      })

      expect(bgColor).toBe('rgb(164, 193, 255)')
    })
  })
})
