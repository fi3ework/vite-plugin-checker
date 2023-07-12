import { describe, expect, it } from 'vitest'

import {
  editFile,
  getHmrOverlayText,
  isServe,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'

describe('config-initialIsOpen-error-clean', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not find overlay', async () => {
      if (isServe) {
        await sleepForServerReady()
        await expect(getHmrOverlayText()).rejects.toThrow(
          'Invariant failed: .message-body is expected in shadow root'
        )

        console.log('-- badge appears, but overlay remains collapsed after error introduced --')
        editFile('src/main.ts', (code) => code.replace('const hello', 'var hello'))
        await sleepForEdit()
        try {
          await getHmrOverlayText()
        } catch (e) {
          expect((e as any).toString()).toContain(
            'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
          )
        }

        console.log('-- badge remains, overlay remains collapsed after warning introduced --')
        editFile('src/main.ts', (code) => code.replace(' as', '! as'))
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
