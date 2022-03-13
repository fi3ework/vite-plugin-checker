import {
  killServer,
  preTest,
  getHmrOverlay,
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

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('overlay-position-style', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  it('get initial error and subsequent error', async () => {
    editFile('vite.config.ts', (code) =>
      code.replace(
        `// checker-edit-slot`,
        `overlay: { position: 'tr', badgeStyle: 'background-color: #E799B0', },`
      )
    )
    await viteServe({
      cwd: testDir,
      launchPage: true,
    })
    await sleep(6000)
    const shadowRoot = await getHmrOverlay()
    const badge = await shadowRoot!.$('.badge-base')
    const { bgColor, top, right } = await badge!.evaluate((el) => {
      // @ts-ignore
      const bgColor = window.getComputedStyle(el).getPropertyValue('background-color')
      // @ts-ignore
      const top = window.getComputedStyle(el).getPropertyValue('top')
      // @ts-ignore
      const right = window.getComputedStyle(el).getPropertyValue('right')
      return { bgColor, top, right }
    })

    expect(bgColor).toBe('rgb(231, 153, 176)')
    expect(top).toBe('0px')
    expect(right).toBe('0px')
  })
})
