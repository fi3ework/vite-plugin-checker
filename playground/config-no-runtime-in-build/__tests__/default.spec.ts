import fs from 'fs'
import klaw from 'klaw'
import path from 'path'
import { sleepForServerReady, isBuild, testDir } from '../../testUtils'
import { describe, expect, it } from 'vitest'

describe('no-runtime-code-in-build', () => {
  describe.runIf(isBuild)('build', () => {
    it('test', async () => {
      await sleepForServerReady()
      for await (const file of klaw(path.resolve(testDir, 'dist'))) {
        if (file.stats.isFile()) {
          const content = await fs.promises.readFile(file.path, 'utf-8')
          expect(content).not.toContain('vite-plugin-checker')
        }
      }
    })
  })
})
