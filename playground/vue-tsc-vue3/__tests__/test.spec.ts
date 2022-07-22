import { describe, expect, it } from 'vitest'

import {
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  diagnostics,
  isServe,
  expectStderrContains,
  log,
  stripedLog,
  isBuild,
  editFile,
} from '../../testUtils'
import stringify from 'fast-json-stable-stringify'

describe('vue3-vue-tsc', () => {
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
    const expectedMsg = `src/App.vue(3,4): error TS2322: Type '{ msg1: string; }' is not assignable to type 'IntrinsicAttributes & Partial<{}> & Omit<Readonly<ExtractPropTypes<{ msg: { type: StringConstructor; required: true; }; }>> & VNodeProps & AllowedComponentProps & ComponentCustomProps, never>'.`

    it('default', async () => {
      expectStderrContains(log, expectedMsg)
    })
  })
})
