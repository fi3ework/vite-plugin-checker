import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import type { CheckerApi } from 'vite-plugin-checker'
import {
  diagnostics,
  expectStderrContains,
  getOverlayPage,
  isBuild,
  isServe,
  log,
  OVERLAY,
  page,
  waitForServerReady,
  stripedLog,
  viteServer,
} from '../../testUtils'

describe('config-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error', async () => {
      await waitForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('links the rule to its docs', async () => {
      await waitForServerReady()
      const link = getOverlayPage().locator('.diagnostic a.code').first()

      expect(await link.textContent({ timeout: 10_000 })).toBe('no-var')
      expect(await link.getAttribute('href')).toBe('https://eslint.org/docs/latest/rules/no-var')
    })

    it('hides the overlay while an integration claims the indicator', async () => {
      await waitForServerReady()
      const shown = page.locator(`${OVERLAY} .badge:not([hidden]), ${OVERLAY} .drawer:not([hidden])`)
      await expect.poll(() => shown.count()).toBe(1)

      const { api } = viteServer.config.plugins.find((plugin) => plugin.name === 'vite-plugin-checker') as {
        api: CheckerApi
      }
      const releaseFirst = api.claimIndicator('first')
      const releaseSecond = api.claimIndicator('second')
      await expect.poll(() => shown.count()).toBe(0)

      releaseFirst()
      await page.waitForTimeout(300)
      expect(await shown.count()).toBe(0)

      releaseSecond()
      await expect.poll(() => shown.count()).toBe(1)
    })

    it('opens the file through `__open-in-editor` when clicked', async () => {
      await waitForServerReady()
      const requested = new Promise<URL>((resolve) => {
        page.route('**/__open-in-editor*', (route) => {
          resolve(new URL(route.request().url()))
          return route.fulfill({ status: 200 })
        })
      })

      const link = getOverlayPage().locator('.diagnostic a.location').first()
      const file = `${diagnostics[0]!.file}:3:1`
      await link.click()

      const url = await requested
      expect(url.pathname).toBe('/my-app/__open-in-editor')
      expect(url.searchParams.get('file')).toBe(file)
      expect(page.url()).not.toContain('__open-in-editor')
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = 'Unexpected var, use let or const instead  no-var'
      expectStderrContains(log, expectedMsg)
    })
  })
})
