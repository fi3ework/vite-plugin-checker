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

describe('eslint', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
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

  describe.runIf(isBuild)('build', () => {
    const expectedMsg = 'Unexpected var, use let or const instead  no-var'

    it('default', async () => {
      expectStderrContains(log, expectedMsg)
    })
  })
})
