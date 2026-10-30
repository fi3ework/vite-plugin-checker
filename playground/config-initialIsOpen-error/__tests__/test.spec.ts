import { describe, expect, it } from 'vitest'

import {
  editFile,
  getHmrOverlayText,
  isServe,
  sleepForServerReady,
  waitForDiagnostics,
  waitForNoOverlay,
} from '../../testUtils'

describe('config-initialIsOpen-error', () => {
  describe.runIf(isServe)('serve', () => {
    it('-- should find overlay with error --', async () => {
      await sleepForServerReady()
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toMatchSnapshot()
      expect(file1).toMatchSnapshot()
      expect(frame1).toMatchSnapshot()

      console.log('-- overlay remains after fix error --')
      editFile('src/main.ts', (code) => code.replace('var hello', `const hello`))
      await waitForDiagnostics()
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toMatchSnapshot()

      console.log('-- overlay dismiss after fix warning --')
      editFile('src/main.ts', (code) => code.replace('! as', ` as`))
      await waitForNoOverlay()
    })
  })
})
