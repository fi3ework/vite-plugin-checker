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

function shouldSkipTest() {
  const NODE_MAJOR_VERSION = Number(process.versions.node.split('.')[0])
  // vue-tsc/out/proxy uses optional chaining which is not supported by node12
  // so we ignore this case on node12 until Vite drop node12 support
  return NODE_MAJOR_VERSION <= 12
}

describe('vue3-vue-tsc', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      if (shouldSkipTest()) {
        return expect(true).toBe(true)
      }

      let diagnostics: any
      await viteServe({
        cwd: testDir,
        wsSend: (_payload) => {
          if (_payload.type === 'custom' && _payload.event === WS_CHECKER_ERROR_EVENT) {
            diagnostics = _payload.data.diagnostics
          }
        },
      })
      await sleepForServerReady(2)
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('src/App.vue', (code) =>
        code.replace('<HelloWorld msg1="Diana" />', '<HelloWorld msg2="Diana" />')
      )
      await sleepForEdit(2)
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    const errMsg = `src/App.vue(3,4): error TS2322: Type '{ msg1: string; }' is not assignable to type 'IntrinsicAttributes & Partial<{}> & Omit<Readonly<ExtractPropTypes<{ msg: { type: StringConstructor; required: true; }; }>> & VNodeProps & AllowedComponentProps & ComponentCustomProps, never>'.`

    it('enableBuild: true', async () => {
      if (shouldSkipTest()) {
        return expect(true).toBe(true)
      }

      await viteBuild({
        expectedErrorMsg: errMsg,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('vueTsc: true', 'vueTsc: true, enableBuild: false,')
      )
      await viteBuild({ unexpectedErrorMsg: errMsg, cwd: testDir })
    })
  })
})
