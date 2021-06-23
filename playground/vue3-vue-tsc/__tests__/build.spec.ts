import {
  preTest,
  postTest,
  viteBuild,
  composeTestTempDirPath,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'

beforeAll(async () => {
  await preTest()
})

afterAll(postTest)

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
      await viteBuild({ expectErrorMsg: 'error TS2322', cwd: composeTestTempDirPath() })
    })
  })
})
