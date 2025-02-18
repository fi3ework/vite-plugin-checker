import stringify from 'fast-json-stable-stringify'
import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  expectStderrContains,
  isBuild,
  isServe,
  stripedLog,
  resetDiagnostics,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
} from '../../testUtils'
import path from 'node:path'

describe('biome', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await sleepForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit error file --')
      resetReceivedLog()
      resetDiagnostics()
      editFile('src/index.js', (code) => code.replace(`var b = 'world'`, `const b = 'world'`))
      await sleepForEdit()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      const expectedMsg = ['Use let or const instead of var', 'Found 2 errors']
      expectStderrContains(stripedLog, expectedMsg)
    })
  })
})
