import { describe, expect, it } from 'vitest'

import {
  editFile,
  getHmrOverlay,
  getHmrOverlayText,
  isServe,
  page,
  pollingUntil,
  sleep,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'

describe('config-overlay-changes', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error from overlay and overlay error content changes on modifying', async () => {
      await sleepForServerReady()
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toMatchSnapshot()
      expect(file1).toMatchSnapshot()
      expect(frame1).toMatchSnapshot()

      console.log('-- copy diagnostics to clipboard --')
      const overlay = page.locator('vite-plugin-checker-error-overlay')
      const actionButton = overlay.locator('.action-button')
      await actionButton.waitFor({ state: 'visible' })

      // Expand overlay if collapsed
      const isCollapsed = await actionButton.evaluate(
        (el) => (el as HTMLElement).querySelector('.summary') !== null
      )
      if (isCollapsed) {
        await actionButton.click()
        await sleep(500) // Wait for expansion
      }

      const copyButton = overlay.locator('.copy-button')
      await copyButton.waitFor({ state: 'visible' })

      // Mock clipboard API
      await page.evaluate(() => {
        ;(window as any).__lastCopiedText = ''
        Object.defineProperty(window.Navigator.prototype, 'clipboard', {
          get: () => ({
            writeText: (text: string) => {
              ;(window as any).__lastCopiedText = text
              return Promise.resolve()
            },
          }),
          configurable: true,
        })
      })

      await copyButton.click()

      // Check visual feedback
      await pollingUntil(
        async () => await copyButton.innerText(),
        (text) => text === 'Copied!'
      )

      // Check "clipboard" content
      const copiedText = await page.evaluate(() => (window as any).__lastCopiedText)
      expect(copiedText).toContain('[eslint]')
      expect(copiedText).toContain('var hello')

      console.log('-- overlay update after edit --')
      editFile('src/main.ts', (code) => code.replace('Hello', 'Hello1'))
      await sleepForEdit()
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toMatchSnapshot()

      console.log('-- overlay dismiss after fix error --')
      editFile('src/main.ts', (code) => code.replace('var hello', `const hello`))
      editFile('src/main.ts', (code) => code.replace('! as', ` as`))
      await sleep(6000)
      await expect(getHmrOverlayText()).rejects.toThrow(
        'Invariant failed: .message-body is expected in shadow root'
      )
    })
  })
})


