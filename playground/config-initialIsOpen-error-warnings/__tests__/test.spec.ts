import { describe, expect, it } from 'vitest'

import { editFile, getHmrOverlayText, isServe, sleepForEdit, sleepForServerReady } from '../../testUtils'

describe('config-initialIsOpen-error-warnings', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not find overlay', async () => {
      if (isServe) {
        await sleepForServerReady()
        try {
          await getHmrOverlayText()
        } catch (e) {
          expect((e as any).toString()).toContain(
            'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
          )
        }

        console.log('-- overlay remains closed after introduced error --')
        editFile('src/main.ts', (code) => code.replace('! as', '! is'))
        await sleepForEdit()
        try {
          await getHmrOverlayText()
        } catch (e) {
          expect((e as any).toString()).toContain(
            'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
          )
        }
      }
    })
  })
})
