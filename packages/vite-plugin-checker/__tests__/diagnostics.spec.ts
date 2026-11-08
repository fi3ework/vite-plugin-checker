import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { toDiagnostics } from '../src/diagnostics'
import { DiagnosticLevel, type DiagnosticRecord } from '../src/types'

const root = path.resolve('/project')
const file = path.join(root, 'src', 'main.ts')

function record(overrides: Partial<DiagnosticRecord> = {}): DiagnosticRecord {
  return {
    message: 'Unexpected var, use let or const instead. (no-var)',
    stack: '',
    id: file,
    checkerId: 'ESLint',
    level: DiagnosticLevel.Error,
    loc: { file, line: 3, column: 1 },
    rule: 'no-var',
    ruleUrl: 'https://eslint.org/docs/latest/rules/no-var',
    endLine: 3,
    endColumn: 20,
    snippet: { start: 1, lines: ['a', 'b', 'var hello'], lang: 'ts' },
    ...overrides,
  }
}

describe('toDiagnostics', () => {
  it('maps a worker record to the public shape', () => {
    const [diagnostic] = toDiagnostics('eslint', [record()], { root })

    expect(diagnostic).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{16}$/),
      checkerId: 'eslint',
      level: 'error',
      message: 'Unexpected var, use let or const instead.',
      code: 'no-var',
      docsUrl: 'https://eslint.org/docs/latest/rules/no-var',
      file,
      displayFile: 'src/main.ts',
      line: 3,
      column: 1,
      endLine: 3,
      endColumn: 20,
      snippet: { start: 1, lines: ['a', 'b', 'var hello'], lang: 'ts' },
    })
  })

  it.each([
    [
      '[lint/style/noVar] Use let or const.',
      'lint/style/noVar',
      'Use let or const.',
    ],
    [
      'TS2322: Type string is not assignable.',
      'TS2322',
      'Type string is not assignable.',
    ],
    [
      'eslint(no-var): Use let or const.',
      'eslint(no-var)',
      'Use let or const.',
    ],
  ])('removes the code from %j', (message, code, stripped) => {
    const [diagnostic] = toDiagnostics(
      'x',
      [record({ message, rule: undefined, code })],
      { root },
    )
    expect(diagnostic!.code).toBe(code)
    expect(diagnostic!.message).toBe(stripped)
  })

  it('gives the same id whatever the line endings and path separators', () => {
    const [unix] = toDiagnostics('x', [record({ message: 'a\n  b' })], { root })
    const [windows] = toDiagnostics('x', [record({ message: 'a\r\n  b' })], {
      root,
    })
    expect(windows!.message).toBe('a\n  b')
    expect(windows!.id).toBe(unix!.id)

    const dotted = path.join(root, 'src', '..', 'src', 'main.ts')
    const [normalized] = toDiagnostics(
      'x',
      [record({ id: dotted, loc: { file: dotted, line: 3, column: 1 } })],
      { root },
    )
    expect(normalized!.file).toBe(file)
    expect(normalized!.id).toBe(toDiagnostics('x', [record()], { root })[0]!.id)
  })

  it.each([
    [DiagnosticLevel.Warning, 'warning'],
    [DiagnosticLevel.Suggestion, 'info'],
    [DiagnosticLevel.Message, 'info'],
    [undefined, 'error'],
  ] as const)('maps level %s to %s', (level, expected) => {
    const [diagnostic] = toDiagnostics('x', [record({ level })], { root })
    expect(diagnostic!.level).toBe(expected)
  })

  it('keeps ids stable and drops repeated diagnostics', () => {
    const first = toDiagnostics('eslint', [record(), record()], { root })
    const second = toDiagnostics('eslint', [record()], { root })

    expect(first).toHaveLength(1)
    expect(first[0]!.id).toBe(second[0]!.id)
  })

  it('builds the editor URL from `overlay.editorUrl`', () => {
    const [diagnostic] = toDiagnostics('eslint', [record()], {
      root,
      editorUrl: ({ file, line, column }) =>
        `vscode://file${file}:${line}:${column}`,
    })
    expect(diagnostic!.editorUrl).toBe(`vscode://file${file}:3:1`)
  })

  it('omits the location of diagnostics without an absolute file', () => {
    const [diagnostic] = toDiagnostics(
      'stylelint',
      [record({ id: undefined, loc: undefined })],
      { root },
    )
    expect(diagnostic).not.toHaveProperty('file')
    expect(diagnostic).not.toHaveProperty('line')
  })
})
