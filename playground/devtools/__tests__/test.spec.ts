import { describe, expect, it } from 'vitest'

import { getHmrOverlayText, isServe, page, sleepForServerReady } from '../../testUtils'

describe.runIf(isServe)('devtools', () => {
  it('shows diagnostics in a Vite DevTools dock alongside the overlay', async () => {
    await sleepForServerReady()
    const [message] = await getHmrOverlayText()
    expect(message).toBe("Type 'string' is not assignable to type 'number'.")

    const dock = page.locator('devframes-dock-embedded')
    const entry = dock.locator('button[aria-label="Checker"]')
    await expect.poll(() => entry.innerText(), { timeout: 20_000 }).toBe('1')

    await dock.locator('#devframes-dock').hover()
    await entry.click()
    const panelMessage = page
      .frameLocator('devframes-dock-embedded iframe[src*="__checker/"]')
      .locator('.diagnostic .message')
    expect(await panelMessage.innerText({ timeout: 20_000 })).toBe(message)
  })
})
