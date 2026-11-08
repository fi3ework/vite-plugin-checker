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
  waitForServerReady,
  stripedLog,
  waitForDiagnostics,
} from '../../testUtils'

describe('svelte-check-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await waitForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      resetReceivedLog()
      editFile('src/App.svelte', (code) =>
        code
          .replace(`'hello'`, '1')
          .replace('<button', '<div')
          .replace('</button>', '</div>'),
      )
      // svelte-check reports a transient TS7016 for the edited component before its real diagnostics
      await waitForDiagnostics({ quietMs: 4_000 })
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      expectStderrContains(
        log,
        "Type 'string' is not assignable to type 'number'.",
      )
    })
  })
})
