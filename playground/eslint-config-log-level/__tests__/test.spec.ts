// import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
  editFile,
  isServe,
} from '../../testUtils'
import stringify from 'fast-json-stable-stringify'

describe('eslint-config-log-level', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      let diagnostics: any
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit error file --')
      resetReceivedLog()
      editFile('src/main.ts', (code) => code.replace(`'Hello'`, `'Hello~'`))
      await sleepForEdit()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })
})
