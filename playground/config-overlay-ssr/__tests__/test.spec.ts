import { describe, expect, it } from 'vitest'

import { diagnostics, getHmrOverlayText, isServe, sleepForServerReady, stripedLog } from '../../testUtils'

// Regression test for https://github.com/fi3ework/vite-plugin-checker/issues/733

describe('config-overlay-ssr', () => {
  describe.runIf(isServe)('serve', () => {
    it('still reports the TypeScript error to the terminal', async () => {
      await sleepForServerReady()
      expect(stripedLog.join('\n')).toContain('TS2322')
      expect(diagnostics.length).toBeGreaterThan(0)
    })

    it('shows the error overlay in the browser', async () => {
      await sleepForServerReady()
      const [message, file] = await getHmrOverlayText()
      expect(message).toContain(`Type 'string' is not assignable to type 'number'.`)
      expect(file).toContain('src/main.ts')
    })
  })
})
