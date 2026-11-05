import { afterEach, describe, expect, it } from 'vitest'

import {
  createFrame,
  lineColLocToBabelLoc,
  tsLikeLocToBabelLoc,
} from '../src/codeFrame'
import { setTerminalColors } from '../src/colors'

describe('code frame', () => {
  afterEach(() => {
    setTerminalColors(false)
  })

  it('highlights only when terminal colours are enabled', () => {
    const loc = { start: { line: 1, column: 7 }, end: { line: 1, column: 8 } }

    setTerminalColors(false)
    expect(createFrame('const a = 1', loc)).not.toContain('\u001B[')

    setTerminalColors(true)
    expect(createFrame('const a = 1', loc)).toContain('\u001B[')
  })

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
