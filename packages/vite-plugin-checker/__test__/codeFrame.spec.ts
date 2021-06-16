import { tsLocationToBabelLocation } from '../src/codeFrame'
import { SourceLocation } from '@babel/code-frame'

describe('code frame', () => {
  it('should add 1 offset to TS location', () => {
    const babelLoc = tsLocationToBabelLocation({
      start: { line: 1, character: 2 },
      end: { line: 3, character: 4 },
    })

    expect(babelLoc).toEqual({
      start: { line: 2, column: 3 },
      end: { line: 4, column: 5 },
    } as SourceLocation)
  })
})
