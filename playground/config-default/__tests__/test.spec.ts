import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  expectStderrContains,
  getHmrOverlay,
  isBuild,
  isServe,
  log,
  page,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('config-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('opens the file through `__open-in-editor` when clicked', async () => {
      await sleepForServerReady()
      const requested = new Promise<URL>((resolve) => {
        page.route('**/__open-in-editor*', (route) => {
          resolve(new URL(route.request().url()))
          return route.fulfill({ status: 200 })
        })
      })

      const shadowRoot = await getHmrOverlay()
      const link = await shadowRoot!.$('.file-link')
      const file = `${diagnostics[0]!.loc!.file}:3:1`
      expect(await link!.getAttribute('href')).toBe(
        `/my-app/__open-in-editor?file=${encodeURIComponent(file)}`,
      )
      await link!.click()

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
