import fs from 'fs'
import klaw from 'klaw'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { isBuild, sleepForServerReady, testDir } from '../../testUtils'

describe('config-no-runtime-code-in-build', () => {
  describe.runIf(isBuild)('build', () => {
    it('should not contain plugin code in build artifacts', async () => {
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
