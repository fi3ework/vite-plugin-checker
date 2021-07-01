import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  viteBuild,
  viteServe,
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
      const [message1, file1] = await getHmrOverlayText()
      expect(message1).toContain('const [count, setCount] = useState<string>(1)')
      expect(message1).toContain(
        `Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.`
      )

      expect(file1).toContain('react-ts/src/App.tsx:7:46')

      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleep(1000)
      const [message2] = await getHmrOverlayText()
      expect(message2).toContain(`const [count, setCount] = useState<string>(2)`)
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
