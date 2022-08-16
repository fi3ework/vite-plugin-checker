import { describe, expect, it } from 'vitest'

import { buildSucceed, isBuild } from '../../testUtils'

describe('config-enableBuild-false', () => {
  describe.runIf(isBuild)('build', () => {
    it('should pass', async () => {
      expect(buildSucceed).toBe(true)
    })
  })
})
