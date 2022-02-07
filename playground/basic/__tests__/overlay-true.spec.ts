import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  sleepForEdit,
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

describe('overlay-true', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  it('overlay prompts and changes', async () => {
    await viteServe({ cwd: testDir, launchPage: true })
    await pollingUntil(getHmrOverlay, (dom) => !!dom)
    const [message1, file1, frame1] = await getHmrOverlayText()
    expect(message1).toMatchSnapshot()
    expect(file1).toMatchSnapshot()
    expect(frame1).toMatchSnapshot()

    console.log('-- overlay update after edit --')
    editFile('src/main.ts', (code) => code.replace('Hello', 'Hello1'))
    await sleepForEdit()
    await pollingUntil(getHmrOverlay, (dom) => !!dom)
    const [, , frame2] = await getHmrOverlayText()
    expect(frame2).toMatchSnapshot()

    console.log('-- overlay dismiss after fix error --')
    editFile('src/main.ts', (code) => code.replace('var hello', `const hello`))
    editFile('src/main.ts', (code) => code.replace('! as', ` as`))
    await sleep(6000)
    await expect(getHmrOverlayText()).rejects.toThrow(
      'Invariant failed: <vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got null'
    )
  })
})
