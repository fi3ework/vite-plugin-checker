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
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { logTimeSerializers } from '../../../scripts/logTimeSerializers'

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(logTimeSerializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('eslint', () => {
  describe('serve', () => {
    beforeEach(async () => {
      await copyCode()
    })

    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      await viteServe({ cwd: testDir })
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toMatchSnapshot()
      expect(file1).toMatchSnapshot()
      expect(frame1).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      resetTerminalLog()
      editFile('src/main.ts', (code) => code.replace(`'Hello'`, `'Hello~'`))
      await sleep(2000)
      // the case will trigger a full reload, so HRM overlay will be flushed
      // await expect(getHmrOverlayText()).rejects.toThrow(
      //   '<vite-error-overlay> shadow dom is expected to be found, but got null'
      // )
      expect(stripedLog).toMatchSnapshot()
    })

    it('overlay: false', async () => {
      resetTerminalLog()
      editFile('vite.config.ts', (code) => code.replace('eslint: {', 'overlay: false, eslint: {'))

      await viteServe({ cwd: testDir })
      await sleep(6000)
      await expect(getHmrOverlayText()).rejects.toThrow(
        '<vite-error-overlay> shadow dom is expected to be found, but got null'
      )

      expect(stripedLog).toMatchSnapshot()

      resetTerminalLog()
      editFile('src/main.ts', (code) => code.replace('var hello', 'const hello'))
      await sleep(2000)
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    beforeEach(async () => {
      await copyCode()
    })

    const expectedMsg = 'Unexpected var, use let or const instead  no-var'

    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: expectedMsg, cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('eslint: {', 'enableBuild: false, eslint: {')
      )
      await viteBuild({ unexpectedErrorMsg: expectedMsg, cwd: testDir })
    })
  })
})
