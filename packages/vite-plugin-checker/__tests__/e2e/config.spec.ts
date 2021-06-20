import {
  preTest,
  postTest,
  declareTests,
  startServer,
  killServer,
  viteBuild,
} from './Sandbox/Sandbox'

beforeAll(async () => {
  await preTest()
})

afterAll(postTest)

describe('typescript', () => {
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
      await viteBuild('error TS2345')
    })
  })
})
