import { describe, expect, it } from 'vitest'

import {
  editFile,
  getHmrOverlayText,
  getOverlayBadge,
  getOverlayFrame,
  isServe,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'

describe('config-initialIsOpen-error-warnings', () => {
  describe.runIf(isServe)('serve', () => {
    it('should not open the drawer when only warning exists', async () => {
      await sleepForServerReady()
      await getOverlayBadge().waitFor()
      expect(await getOverlayFrame()).toBeNull()

      console.log('-- overlay appears after introduce an error --')
      editFile('src/main.ts', (code) => code.replace('const rootDom', 'var rootDom'))
      await sleepForEdit()
      const [, , frame] = await getHmrOverlayText()
      expect(frame).toMatchSnapshot()
    })
  })
})
