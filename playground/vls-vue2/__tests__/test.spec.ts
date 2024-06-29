import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  editFile,
  expectStderrContains,
  isBuild,
  isServe,
  log,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
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

  // As per https://github.com/vuejs/vetur/issues/3686
  // We may remove VLS in the future to push the community to Vue 3 & Vue Language Tools.
  // describe.runIf(isBuild)('build', () => {
  //   it('should fail', async () => {
  //     expectStderrContains(log, `Property 'msg1' does not exist on type`)
  //   })
  // })
})
