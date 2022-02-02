import stringify from 'fast-json-stable-stringify'
import {
  killServer,
  preTest,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
  viteBuild,
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

describe('typescript', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      let diagnostics: any
      await viteServe({
        cwd: testDir,
        wsSend: (_payload) => {
          if (_payload.type === 'custom' && _payload.event == WS_CHECKER_ERROR_EVENT) {
            diagnostics = _payload.data.diagnostics
          }
        },
      })
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleepForEdit()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: 'error TS2345', cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('typescript: true,', 'typescript: true, enableBuild: false,')
      )
      await viteBuild({ unexpectedErrorMsg: 'error TS2345', cwd: testDir })
    })
  })
})
