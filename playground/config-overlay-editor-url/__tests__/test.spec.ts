import { describe, expect, it } from 'vitest'
import { getHmrOverlay, isServe, sleepForServerReady } from '../../testUtils'

describe('config-overlay-editor-url', () => {
  describe.runIf(isServe)('serve', () => {
    it('links the file to the URL from `overlay.editorUrl`', async () => {
      await sleepForServerReady()
      const shadowRoot = await getHmrOverlay()
      const link = await shadowRoot!.$('.file-link')

      expect(await link!.innerText()).toBe('src/main.ts:3:1')
      expect(await link!.getAttribute('href')).toBe('vscode://file/host/project/src/main.ts:3:1')
    })
  })
})
