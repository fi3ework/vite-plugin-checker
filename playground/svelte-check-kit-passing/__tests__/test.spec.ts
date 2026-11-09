import { describe, expect, it } from 'vitest'
import { buildSucceed, isBuild } from '../../testUtils'

describe('svelte-check-kit-passing', () => {
  describe.runIf(isBuild)('build', () => {
    // SvelteKit 3 resolves the Vite config in its own worker while analysing
    // routes, which must not be mistaken for one of the checker workers.
    it('succeeds', () => {
      expect(buildSucceed).toBe(true)
    })
  })
})
