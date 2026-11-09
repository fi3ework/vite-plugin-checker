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

describe('svelte-check-kit-default', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await waitForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      resetReceivedLog()
      editFile(
        'src/routes/+page.svelte',
        (code) =>
          code
            .replace(`'hello'`, '1')
            .replace('<button', '<div')
            .replace('</button>', '</div>'),
        { atomic: true },
      )
      await waitForDiagnostics({
        until: (all) => all.some((d) => d.displayFile === 'src/routes/+page.svelte'),
      })
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
