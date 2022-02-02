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
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'
import { WS_CHECKER_ERROR_EVENT } from '../../../packages/vite-plugin-checker/src/client'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('eslint', () => {
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

      console.log('-- edit error file --')
      resetReceivedLog()
      editFile('src/main.ts', (code) => code.replace(`'Hello'`, `'Hello~'`))
      await sleepForEdit()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit non error file --')
      resetReceivedLog()
      editFile('src/text.ts', (code) => code.replace(`Vanilla`, `vanilla`))
      await sleepForEdit()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    const expectedMsg = 'Unexpected var, use let or const instead  no-var'

    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: expectedMsg, cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('eslint: {', 'enableBuild: false, eslint: {')
      )
      await viteBuild({ unexpectedErrorMsg: expectedMsg, cwd: testDir })
    })
  })
})
