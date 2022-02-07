/* eslint-disable max-nested-callbacks */
import {
  getHmrOverlayText,
  killServer,
  preTest,
  viteServe,
} from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'

import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('overlay-initialIsOpen-false', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace(`// edit-slot`, `overlay: { initialIsOpen: false },`)
      )
      await viteServe({
        cwd: testDir,
        launchPage: true,
      })
      await sleep(6000)
      const [message, file, frame] = await getHmrOverlayText()
      expect(message).toMatchSnapshot()
      expect(file).toMatchSnapshot()
      expect(frame).toMatchSnapshot()
    })
  })
})
