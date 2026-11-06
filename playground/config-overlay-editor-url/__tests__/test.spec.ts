import { describe, expect, it } from 'vitest'
import { getOverlayPage, isServe, sleepForServerReady } from '../../testUtils'

describe('config-overlay-editor-url', () => {
  describe.runIf(isServe)('serve', () => {
    it('links the file to the URL from `overlay.editorUrl`', async () => {
      await sleepForServerReady()
      const link = getOverlayPage().locator('.diagnostic a.location').first()

      expect(await link.innerText({ timeout: 10_000 })).toBe('3:1')
      expect(await link.getAttribute('href')).toBe('vscode://file/host/project/src/main.ts:3:1')
    })
  })
})
