import path from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { isServe, page, pollingUntil, sleepForServerReady, testDir } from '../../testUtils'

async function getOverlayMessages() {
  return page.evaluate(() =>
    [...document.body.children]
      .filter((el) => el.tagName.toLowerCase().startsWith('vite-plugin-checker-error-overlay'))
      .map((el) => el.shadowRoot?.querySelector('.message-body')?.textContent ?? '')
      .sort()
  )
}

describe('multiple-servers', () => {
  describe.runIf(isServe)('serve', () => {
    let widgetServer: ViteDevServer | undefined

    afterAll(async () => {
      await widgetServer?.close()
    })

    it('shows an overlay for each vite server connected to the page', async () => {
      widgetServer = await createServer({
        configFile: path.resolve(testDir, 'widget/vite.config.js'),
        server: { port: 5273 + Number(process.env.VITEST_POOL_ID), strictPort: true },
      })
      await widgetServer.listen()

      const widgetOrigin = `http://localhost:${widgetServer.config.server.port}`
      await page.addScriptTag({
        type: 'module',
        url: `${widgetOrigin}/@vite-plugin-checker-runtime-entry`,
      })

      await sleepForServerReady()
      await pollingUntil(getOverlayMessages, (messages) => messages.filter(Boolean).length === 2)

      const messages = await getOverlayMessages()
      expect(messages).toHaveLength(2)
      expect(messages[0]).toContain(`Type 'number' is not assignable to type 'string'`)
      expect(messages[1]).toContain(`Type 'string' is not assignable to type 'number'`)
    })
  })
})
