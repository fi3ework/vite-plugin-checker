import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  expectStderrContains,
  isBuild,
  isServe,
  log,
  resetDiagnostics,
  resetReceivedLog,
  sleepForEdit,
  sleepForServerReady,
  stripedLog,
} from '../../testUtils'

describe('oxlint-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('should display initial errors', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('should react to project file change', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      editFile('src/main.ts', (code) =>
        code.replace('const unusedVariable1 = 42;', ''),
      )
      await sleepForEdit()

      resetReceivedLog()
      resetDiagnostics()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('should react to oxlint config file change', async () => {
      await sleepForServerReady()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      resetReceivedLog()
      resetDiagnostics()

      editFile('.oxlintrc.json', (code) =>
        code.replace('"correctness": "error"', '"correctness": "warn"'),
      )
      await sleepForEdit()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      expectStderrContains(log, "Variable 'count' is declared but never used.")
    })
  })
})
