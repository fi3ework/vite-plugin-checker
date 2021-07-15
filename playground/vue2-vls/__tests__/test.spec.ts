import os from 'os'

import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  resetTerminalLog,
  stripedLog,
  viteBuild,
  viteServe,
  waitForHmrOverlay,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { logTimeSerializers } from '../../../scripts/logTimeSerializers'

expect.addSnapshotSerializer(logTimeSerializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('vue2-vls', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  describe('serve', () => {
    it('get initial error and subsequent error', async () => {
      await viteServe({ cwd: testDir, port: 3001, path: '/vue-template/' })

      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toMatchSnapshot()
      expect(file1).toMatchSnapshot()
      expect(frame1).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetTerminalLog()
      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleep(process.env.CI ? 5000 : 2000)
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('overlay: false', async () => {
      resetTerminalLog()
      editFile('vite.config.ts', (code) =>
        code.replace('checker({ vls: {} })', 'checker({ vls: {}, overlay: false })')
      )

      await viteServe({ cwd: testDir, port: 3001, path: '/vue-template/' })
      await sleep(6000)
      await expect(getHmrOverlayText()).rejects.toThrow(
        '<vite-error-overlay> shadow dom is expected to be found, but got null'
      )

      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetTerminalLog()
      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleep(process.env.CI ? 5000 : 2000)
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    beforeEach(async () => {
      await copyCode()
    })

    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('checker({ vls: {} })', 'checker({ vls: {}, enableBuild: false })')
      )
      await viteBuild({
        unexpectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
