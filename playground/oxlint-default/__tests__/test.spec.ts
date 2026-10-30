import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'
import {
  diagnostics,
  editFile,
  editFileTo,
  expectStderrContains,
  hasDiagnosticFor,
  isBuild,
  isServe,
  removeFile,
  log,
  resetDiagnostics,
  resetReceivedLog,
  sleepForServerReady,
  stripedLog,
  waitForDiagnostics,
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
      await waitForDiagnostics()

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
      await waitForDiagnostics()

      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })

    it('lints added files and clears removed ones', async () => {
      await sleepForServerReady()

      editFileTo('src/added.ts', 'debugger;\n')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.ts')).toBe(true)

      removeFile('src/added.ts')
      await waitForDiagnostics()
      expect(hasDiagnosticFor('src/added.ts')).toBe(false)
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      expectStderrContains(
        log,
        "Variable 'unusedVariable1' is declared but never used.",
      )
    })
  })
})
