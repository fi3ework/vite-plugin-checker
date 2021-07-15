import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  waitForHmrOverlay,
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

expect.addSnapshotSerializer(logTimeSerializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('typescript', () => {
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

      console.log('-- edit file --')
      resetTerminalLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(process.env.CI ? 5000 : 2000)
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('overlay: false', async () => {
      resetTerminalLog()
      editFile('vite.config.ts', (code) =>
        code.replace('typescript: true,', 'typescript: true, overlay: false,')
      )

      await viteServe({ cwd: testDir })
      await sleep(6000)
      await expect(getHmrOverlayText()).rejects.toThrow(
        '<vite-error-overlay> shadow dom is expected to be found, but got null'
      )

      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetTerminalLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(process.env.CI ? 5000 : 2000)
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    beforeEach(async () => {
      await copyCode()
    })

    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: 'error TS2345', cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('typescript: true,', 'typescript: true, enableBuild: false,')
      )
      await viteBuild({ unexpectedErrorMsg: 'error TS2345', cwd: testDir })
    })
  })
})
