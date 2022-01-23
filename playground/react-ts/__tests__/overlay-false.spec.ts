import {
  getHmrOverlayText,
  killServer,
  preTest,
  viteServe,
} from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'

import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

expect.addSnapshotSerializer(serializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('overlay', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  it('overlay: false', async () => {
    editFile('vite.config.ts', (code) =>
      code.replace('typescript: true,', 'typescript: true, overlay: false,')
    )

    await viteServe({ cwd: testDir, launchPage: true })
    await sleep(6000)
    await expect(getHmrOverlayText()).rejects.toThrow(
      'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
    )
  })
})
