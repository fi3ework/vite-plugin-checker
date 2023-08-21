import { describe, expect, it } from 'vitest'

import { editFile, getHmrOverlay, getHmrOverlayText, isServe, pollingUntil, sleep, sleepForEdit, sleepForServerReady } from '../../testUtils'

describe('config-initialIsOpen-error', () => {
  describe.runIf(isServe)('serve', () => {
    it('should find overlay', async () => {
      if (isServe) {
        await sleepForServerReady()
        const [message1, file1, frame1] = await getHmrOverlayText()
        expect(message1).toMatchSnapshot()
        expect(file1).toMatchSnapshot()
        expect(frame1).toMatchSnapshot()

        console.log('-- overlay remains after fix error --')
        editFile('src/main.ts', (code) => code.replace('var hello', `const hello`))
        await sleepForEdit()
        await pollingUntil(getHmrOverlay, (dom) => !!dom)
        const [, , frame2] = await getHmrOverlayText()
        expect(frame2).toMatchSnapshot()

        console.log('-- overlay dismiss after fix warning --')
        editFile('src/main.ts', (code) => code.replace('! as', ` as`))
        await sleep(6000)
        await expect(getHmrOverlayText()).rejects.toThrow(
          'Invariant failed: .message-body is expected in shadow root'
        )
      }
    })
  })
})
