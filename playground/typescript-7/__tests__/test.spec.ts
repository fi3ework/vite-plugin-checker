import fs from 'node:fs'
import path from 'node:path'
import stringify from 'fast-json-stable-stringify'
import { describe, expect, it } from 'vitest'

import {
  diagnostics,
  expectStderrContains,
  isBuild,
  isServe,
  log,
  resetReceivedLog,
  waitForServerReady,
  stripedLog,
  testDir,
  waitForDiagnostics,
} from '../../testUtils'

describe('typescript-7', () => {
  describe.runIf(isServe)('serve', () => {
    it('get initial error and subsequent error', async () => {
      await waitForServerReady()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()

      console.log('-- edit file --')
      resetReceivedLog()
      const file = path.resolve(testDir, 'src/main.ts')
      const tmp = path.resolve(testDir, 'main.ts.tmp')
      fs.writeFileSync(
        tmp,
        fs
          .readFileSync(file, 'utf-8')
          .replace("'not a number'", "'still not a number'"),
      )
      fs.renameSync(tmp, file)
      await waitForDiagnostics()
      expect(stringify(diagnostics)).toMatchSnapshot()
      expect(stripedLog).toMatchSnapshot()
    })
  })

  describe.runIf(isBuild)('build', () => {
    it('should fail', async () => {
      expectStderrContains(log, 'TS2322')
    })
  })
})
