import {
  preTest,
  postTest,
  viteBuild,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  testDir,
  editFile,
  sleep,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('vue2-vls', () => {
  // describe('dev', () => {
  //   beforeAll(async () => {
  //     await startServer(false)
  //   })

  //   afterAll(async () => {
  //     await killServer()
  //   })

  //   declareTests(false)
  // })

  describe('build', () => {
    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace(
          'Checker({ vls: VlsChecker() })',
          'Checker({ vls: VlsChecker(), enableBuild: false })'
        )
      )
      await viteBuild({
        unexpectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
