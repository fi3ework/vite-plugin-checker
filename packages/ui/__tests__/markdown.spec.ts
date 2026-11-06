import { describe, expect, it } from 'vitest'
import { diagnosticsToMarkdown, diagnosticToMarkdown } from '../src/markdown'
import { diagnostic } from './fixtures'

describe('markdown', () => {
  it('formats a diagnostic with its snippet', () => {
    expect(
      diagnosticToMarkdown(
        diagnostic({
          code: 'TS2322',
          docsUrl: 'https://example.com/ts2322',
          line: 9,
          column: 3,
          endLine: 10,
          message: "Type 'number' is not assignable to type 'string'.",
          snippet: { start: 8, lines: ['a', 'b', 'c', '```'], lang: 'ts' },
        }),
        'TypeScript',
      ),
    ).toMatchInlineSnapshot(`
      "**error** [\`TS2322\`](https://example.com/ts2322) (TypeScript)

      \`src/a.ts:9:3\`

      Type 'number' is not assignable to type 'string'.

      \`\`\`\`ts
         8 | a
      >  9 | b
      > 10 | c
        11 | \`\`\`
      \`\`\`\`"
    `)
  })

  it('formats file-less diagnostics and joins several', () => {
    expect(
      diagnosticsToMarkdown(
        [
          diagnostic({
            file: undefined,
            displayFile: undefined,
            line: undefined,
          }),
          diagnostic({ code: 'no-var', level: 'warning', checkerId: 'eslint' }),
        ],
        (id) => id.toUpperCase(),
      ),
    ).toMatchInlineSnapshot(`
      "**error** (TYPESCRIPT)

      Type error

      ---

      **warning** \`no-var\` (ESLINT)

      \`src/a.ts:1:1\`

      Type error"
    `)
  })
})
