import { describe, expect, it } from 'vitest'

import {
  editFile,
  getHmrOverlay,
  getHmrOverlayText,
  isServe,
  pollingUntil,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'

describe('config-initialIsOpen-error-warnings', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not show overlay when only warning exists', async () => {
      await sleepForServerReady()
      try {
        await getHmrOverlayText()
      } catch (e) {
        expect((e as any).toString()).toContain(
          'Invariant failed: .message-body is expected in shadow root'
        )
      }

      console.log('-- overlay appears after introduce an error --')
      editFile('src/main.ts', (code) => code.replace('const rootDom', 'var rootDom'))
      await sleepForEdit()
      await getHmrOverlayText()
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [, , frame] = await getHmrOverlayText()
      expect(frame).toMatchSnapshot()
    })
  })
})
