import { describe, expect, it } from 'vitest'

import { lineColLocToBabelLoc, tsLikeLocToBabelLoc } from '../src/codeFrame'

describe('code frame', () => {
  it('should add 1 offset to TS location', () => {
    const babelLoc = tsLikeLocToBabelLoc({
      start: { line: 1, character: 2 },
      end: { line: 3, character: 4 },
    })

    expect(babelLoc).toEqual({
      start: { line: 2, column: 3 },
      end: { line: 4, column: 5 },
    })
  })

  it('transform location without offset', () => {
    const babelLoc = lineColLocToBabelLoc({
      line: 1,
      column: 2,
      endLine: 3,
      endColumn: 4,
    })

    expect(babelLoc).toEqual({
      start: { line: 1, column: 2 },
      end: { line: 3, column: 4 },
    })
  })
})
