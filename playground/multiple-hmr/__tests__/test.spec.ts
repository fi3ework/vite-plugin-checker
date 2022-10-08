import stringify from 'fast-json-stable-stringify'
import stable from 'sort-deep-object-arrays'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  editFile,
  expectStderrContains,
  isBuild,
  isServe,
  resetDiagnostics,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('multiple-hmr', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit with error --')
      resetDiagnostics()
      resetReceivedLog()
      editFile('src/App.tsx', (code) => code.replace('useState<string>(1)', 'useState<string>(2)'))
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      // expect(stripedLog).toMatchSnapshot()

      console.log('-- fix typescript error --')
      resetDiagnostics()
      resetReceivedLog()
      editFile('src/App.tsx', (code) =>
        code.replace('useState<string>(2)', `useState<string>('x')`)
      )
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      // expect(stripedLog).toMatchSnapshot()

      console.log('-- fix eslint error --')
      resetDiagnostics()
      resetReceivedLog()
      editFile('src/App.tsx', (code) => code.replace('var', 'const'))
      await sleepForEdit()
      expect(stringify(stable(diagnostics))).toMatchSnapshot()
      // expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    const expectedMsg = [
      '6:3  error  Unexpected var, use let or const instead  no-var',
      `src/App.tsx(6,44): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.`,
    ]

    it('should fail', async () => {
      expectStderrContains(stripedLog, expectedMsg)
    })
  })
})
