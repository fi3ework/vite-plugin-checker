import { afterEach, describe, expect, it } from 'vitest'

import {
  createFrame,
  createSnippet,
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

  it('extracts the lines around a location', () => {
    const source = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join(
      '\r\n',
    )

    expect(
      createSnippet(source, { start: { line: 10 } }, '/p/App.vue?vue'),
    ).toEqual({
      start: 8,
      lines: ['line 8', 'line 9', 'line 10', 'line 11', 'line 12', 'line 13'],
      lang: 'vue',
    })
    expect(
      createSnippet(source, { start: { line: 1 }, end: { line: 2 } }),
    ).toEqual({
      start: 1,
      lines: ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
    })
    expect(createSnippet(source, { start: { line: 19 } })!.lines).toEqual([
      'line 17',
      'line 18',
      'line 19',
      'line 20',
    ])
  })

  it('caps the snippet of a long range', () => {
    const source = Array.from({ length: 100 }, (_, i) => `${i + 1}`).join('\n')
    const snippet = createSnippet(source, {
      start: { line: 5 },
      end: { line: 90 },
    })
    expect(snippet!.lines.at(-1)).toBe('18')
  })

  it('does not treat the final newline as a line of its own', () => {
    expect(createSnippet('a\nb\n', { start: { line: 1 } })!.lines).toEqual([
      'a',
      'b',
    ])
    expect(createSnippet('a\nb\n', { start: { line: 3 } })!.lines).toEqual([
      'a',
      'b',
      '',
    ])
  })

  it('returns no snippet for a line outside the source', () => {
    expect(createSnippet('a\nb', { start: { line: 0 } })).toBeUndefined()
    expect(createSnippet('a\nb', { start: { line: 3 } })).toBeUndefined()
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
