import { killServer, preTest, viteServe } from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'
import { WebSocketServer } from 'ws'

import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

expect.addSnapshotSerializer(serializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('hmr', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  it('hmr-config', async () => {
    const port = 4567
    const path = '/custom-path'

    const hmrConfig = `
      server: {
        hmr: {
          clientPort: ${port},
          path: '${path}',
        },
      },`

    editFile('vite.config.ts', (code) => code.replace('// config-edit-slot', hmrConfig))

    const ws = new WebSocketServer({
      port,
      path,
    })

    const wsPromise = new Promise((resolve) => {
      ws.on('connection', function connection(ws) {
        resolve(undefined)
      })
    })

    await viteServe({ cwd: testDir, launchPage: true })
    await wsPromise
    ws.close()
  })
})
