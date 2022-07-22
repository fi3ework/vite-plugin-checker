import { describe, expect, it } from 'vitest'
import {
  editFile,
  getHmrOverlay,
  getHmrOverlayText,
  isServe,
  pollingUntil,
  sleep,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'

describe('config-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial and following errors', async () => {
      await sleepForServerReady()
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toMatchSnapshot()
      expect(file1).toMatchSnapshot()
      expect(frame1).toMatchSnapshot()

      console.log('-- overlay update after edit --')
      editFile('src/main.ts', (code) => code.replace('Hello', 'Hello1'))
      await sleepForEdit()
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toMatchSnapshot()

      console.log('-- overlay dismiss after fix error --')
      editFile('src/main.ts', (code) => code.replace('var hello', `const hello`))
      editFile('src/main.ts', (code) => code.replace('! as', ` as`))
      await sleep(6000)
      await expect(getHmrOverlayText()).rejects.toThrow(
        'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
      )
    })
  })
})
