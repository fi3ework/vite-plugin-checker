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

describe('vue-tsc-vue3-ts4', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
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

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = `error TS2345`
      expectStderrContains(log, expectedMsg)
    })
  })
})
