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

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('multiple-reload', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      let errors: any[] = []
      await viteServe({
        cwd: testDir,
        wsSend: (_payload) => {
          if (_payload.type === 'custom' && _payload.event === WS_CHECKER_ERROR_EVENT) {
            errors = errors.concat(_payload.data.errors)
          }
        },
        proxyConsole: () => proxyConsoleInTest(true),
      })
      await sleepForServerReady()
      expect(stringify(stable(errors))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit with error --')
      errors = []
      resetReceivedLog()
      editFile('src/main.ts', (code) => code.replace(`'Hello1'`, `'Hello1~'`))
      await sleepForEdit()
      expect(stringify(stable(errors))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit on non-error file --')
      errors = []
      resetReceivedLog()
      editFile('src/text.ts', (code) => code.replace(`Multiple`, `multiple`))
      await sleepForEdit()
      expect(stringify(stable(errors))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    const expectedMsg = [
      '3:1  error  Unexpected var, use let or const instead  no-var',
      '4:1  error  Unexpected var, use let or const instead  no-var',
      `src/main.ts(3,5): error TS2322: Type 'string' is not assignable to type 'number'.`,
      `src/main.ts(4,5): error TS2322: Type 'string' is not assignable to type 'boolean'.`,
    ]

    it('enableBuild: true', async () => {
      await viteBuild({ expectedErrorMsg: expectedMsg, cwd: testDir })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('eslint: {', 'enableBuild: false, eslint: {')
      )
      await viteBuild({
        unexpectedErrorMsg: 'error',
        cwd: testDir,
      })
    })
  })
})
