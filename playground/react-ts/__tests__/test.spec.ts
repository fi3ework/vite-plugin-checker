import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  viteBuild,
  viteServe,
  stripedLog,
  resetTerminalLog,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'

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

    const snapshot = {
      errorCode1: 'const [count, setCount] = useState<string>(1)',
      errorCode2: 'const [count, setCount] = useState<string>(2)',
      absPath: 'react-ts/src/App.tsx:7:46',
      relativePath: 'src/App.tsx:7:46',
      errorMsg: `Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.`,
    }

    it('get initial error and subsequent error', async () => {
      await viteServe({ cwd: testDir })
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
      const [message1, file1, frame1] = await getHmrOverlayText()
      expect(message1).toContain(snapshot.errorMsg)
      expect(file1).toContain(snapshot.absPath)
      expect(frame1).toContain(snapshot.errorCode1)
      expect(stripedLog).toContain(snapshot.errorCode1)
      expect(stripedLog).toContain(snapshot.errorMsg)
      expect(stripedLog).toContain(snapshot.relativePath)

      resetTerminalLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(2000)
      const [, , frame2] = await getHmrOverlayText()
      expect(frame2).toContain(snapshot.errorCode2)
      expect(stripedLog).toContain(snapshot.errorCode2)
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

      expect(stripedLog).toContain(snapshot.errorCode1)
      expect(stripedLog).toContain(snapshot.errorMsg)
      expect(stripedLog).toContain(snapshot.relativePath)

      resetTerminalLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(2000)
      expect(stripedLog).toContain(snapshot.errorCode2)
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
