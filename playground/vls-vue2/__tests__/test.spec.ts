import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  expectStderrContains,
  sleepForServerReady,
  diagnostics,
  isBuild,
  isServe,
  log,
  stripedLog,
  resetReceivedLog,
  sleepForEdit,
  editFile,
} from '../../testUtils'

describe('vue2-vls', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleepForEdit()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('enableBuild: true', async () => {
      console.log('👰', log)
      expectStderrContains(log, `Property 'msg1' does not exist on type`)
    })
  })
})
