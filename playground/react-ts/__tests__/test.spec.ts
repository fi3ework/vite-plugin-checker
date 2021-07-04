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

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('typescript', () => {
  describe('serve', () => {
    beforeAll(async () => {
      await viteServe({ cwd: testDir })
      await pollingUntil(getHmrOverlay, (dom) => !!dom)
    })

    afterAll(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      const snapshot = {
        errorCode1: 'const [count, setCount] = useState<string>(1)',
        errorCode2: 'const [count, setCount] = useState<string>(2)',
        absPath: 'react-ts/src/App.tsx:7:46',
        relativePath: 'src/App.tsx:7:46',
        errorMsg: `Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.`,
      }

      const [message1, file1] = await getHmrOverlayText()
      expect(message1).toContain(snapshot.errorCode1)
      expect(message1).toContain(snapshot.errorMsg)
      expect(file1).toContain(snapshot.absPath)
      expect(stripedLog).toContain(snapshot.errorCode1)
      expect(stripedLog).toContain(snapshot.errorMsg)
      expect(stripedLog).toContain(snapshot.relativePath)

      resetTerminalLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(1000)
      const [message2] = await getHmrOverlayText()
      expect(message2).toContain(snapshot.errorCode2)
      expect(stripedLog).toContain(snapshot.errorCode2)
    })
  })

  describe('build', () => {
    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: 'error TS2345', cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('typescript: true,', 'typescript: true, enableBuild: false')
      )
      await viteBuild({ unexpectedErrorMsg: 'error TS2345', cwd: testDir })
    })
  })
})
