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
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

expect.addSnapshotSerializer(serializers)

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('vue2-vls', () => {
  beforeEach(async () => {
    await copyCode()
  })

  describe('serve', () => {
    afterEach(async () => {
      await killServer()
    })

    it('get initial error and subsequent error', async () => {
      let err: any

      await viteServe({
        cwd: testDir,
        // @ts-expect-error
        wsSend: (_payload) => (err = _payload.err),
      })

      await sleepForServerReady(2)
      expect(stringify(err)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleepForEdit()

      expect(stringify(err)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe('build', () => {
    beforeEach(async () => {
      await copyCode()
    })

    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('checker({ vls: {} })', 'checker({ vls: {}, enableBuild: false })')
      )

      await viteBuild({
        unexpectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
