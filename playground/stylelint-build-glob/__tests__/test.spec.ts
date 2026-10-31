import { describe, it } from 'vitest'

import { expectStderrContains, isBuild, log } from '../../testUtils'

describe('stylelint build glob', () => {
  describe.runIf(isBuild)('build', () => {
    it('fails on a nested scss error with an unquoted glob', () => {
      expectStderrContains(log, 'Empty block')
    })
  })
})
