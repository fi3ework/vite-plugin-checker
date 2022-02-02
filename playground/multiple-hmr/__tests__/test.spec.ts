import stringify from 'fast-json-stable-stringify'
// @ts-expect-error
import stable from 'sort-deep-object-arrays'
import {
  killServer,
  preTest,
  proxyConsoleInTest,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
  viteServe,
} from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'
import { WS_CHECKER_ERROR_EVENT } from 'vite-plugin-checker/src/client'

import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

expect.addSnapshotSerializer(serializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('multiple-hmr', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      let diagnostics: any[] = []
      await viteServe({
        cwd: testDir,
        wsSend: (_payload) => {
          if (_payload.type === 'custom' && _payload.event === WS_CHECKER_ERROR_EVENT) {
            diagnostics = diagnostics.concat(_payload.data.diagnostics)
          }
        },
        proxyConsole: () => proxyConsoleInTest(true),
      })
      await sleepForServerReady()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit with error --')
      diagnostics = []
      resetReceivedLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- fix typescript error --')
      diagnostics = []
      resetReceivedLog()
      editFile('src/App.tsx', (code) =>
        code.replace('useState<string>(2)', `useState<string>('x')`)
      )
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- fix eslint error --')
      diagnostics = []
      resetReceivedLog()
      editFile('src/App.tsx', (code) => code.replace('var', 'const'))
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })
})
