import {
  preTest,
  postTest,
  viteBuild,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import { testDir } from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'

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
      await viteBuild({ expectedErrorMsg: 'error TS2322', cwd: testDir })
    })
  })
})
