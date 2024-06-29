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

describe('eslint-default', () => {
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
    const expectedMsg = 'Unexpected var, use let or const instead'

    it('should fail', async () => {
      expectStderrContains(log, expectedMsg)
    })
  })
})
