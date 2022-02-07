import { preTest, viteBuild } from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('enableBuild-false', () => {
  beforeEach(async () => {
    await copyCode()
  })

  it('test', async () => {
    editFile('vite.config.ts', (code) => code.replace(`// edit-slot`, `enableBuild: false,`))
    await viteBuild({
      unexpectedErrorMsg: 'error',
      cwd: testDir,
    })
  })
})
