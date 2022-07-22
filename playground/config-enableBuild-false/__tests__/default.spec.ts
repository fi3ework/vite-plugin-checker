import { buildSucceed, isBuild } from '../../testUtils'
import { describe, it, expect } from 'vitest'

describe('enableBuild-false', () => {
  describe.runIf(isBuild)('build', () => {
    it('build', async () => {
      expect(buildSucceed).toBe(true)
    })
  })
})
