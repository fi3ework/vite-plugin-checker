import { describe, expect, it } from 'vitest'

import {
  checkerApi,
  getHmrOverlayText,
  isServe,
  page,
  waitForServerReady,
} from '../../testUtils'

describe.runIf(isServe)('devtools', () => {
  it('shows diagnostics in a Vite DevTools dock alongside the overlay', async () => {
    await waitForServerReady()
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
    await expect
      .poll(() => panelMessage.textContent(), { timeout: 20_000 })
      .toBe(message)
  })

  it('hides the dock while an integration claims DevTools', async () => {
    await waitForServerReady()
    const entry = page.locator('devframes-dock-embedded button[aria-label="Checker"]')
    await expect.poll(() => entry.count(), { timeout: 20_000 }).toBe(1)

    const release = checkerApi.claimDevTools('test')
    await expect.poll(() => entry.count(), { timeout: 20_000 }).toBe(0)

    release()
    await expect.poll(() => entry.count(), { timeout: 20_000 }).toBe(1)
  })
})
