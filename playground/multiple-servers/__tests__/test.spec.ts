import path from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { isServe, page, waitForServerReady, testDir } from '../../testUtils'

async function getOverlayMessages() {
  const hosts = page.locator('vite-plugin-checker-overlay')
  const messages: string[] = []
  for (const host of await hosts.all()) {
    const badge = host.locator('.badge')
    if (await badge.isVisible()) await badge.dispatchEvent('click')
    const message = host.frameLocator('iframe').locator('.diagnostic .message').first()
    await expect.poll(() => message.textContent(), { timeout: 10_000 }).toBeTruthy()
    messages.push((await message.textContent())!)
  }
  return messages.sort()
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
      await page.addScriptTag({ type: 'module', url: `${widgetOrigin}/@vite/client` })

      await waitForServerReady()
      await expect.poll(() => page.locator('vite-plugin-checker-overlay').count()).toBe(2)

      const messages = await getOverlayMessages()
      expect(messages).toHaveLength(2)
      expect(messages[0]).toContain(`Type 'number' is not assignable to type 'string'`)
      expect(messages[1]).toContain(`Type 'string' is not assignable to type 'number'`)
    })
  })
})
