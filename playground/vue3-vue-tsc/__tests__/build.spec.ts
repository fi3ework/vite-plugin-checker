import {
  postTest,
  preTest,
  viteBuild,
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

describe('vue3-vue-tsc', () => {
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
    it('console error', async () => {
      await viteBuild({ expectedErrorMsg: 'error TS2322', cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('vueTsc: true', 'typescript: true, enableBuild: false')
      )
      await viteBuild({ unexpectedErrorMsg: 'error TS2322', cwd: testDir })
    })
  })
})
