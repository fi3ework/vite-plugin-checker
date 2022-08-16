import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  editFile,
  isServe,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('eslint-config-log-level', () => {
  describe.runIf(isServe)('serve', () => {
    it('should only emit warning logs', async () => {
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
