import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { runOxlint } from '../src/checkers/oxlint/cli'

const tempDirs: string[] = []

async function createTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oxlint-cli-test-'))
  tempDirs.push(dir)
  return dir
}

describe('runOxlint', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => fs.rm(dir, { recursive: true, force: true })),
    )
  })

  it('reports accurate locations for CRLF files with non-ASCII characters', async () => {
    const dir = await createTempDir()
    const file = path.join(dir, 'index.js')
    await fs.writeFile(
      file,
      '// åäöåäöåäöåäöåäö\r\nif (!!x) { yy(); }\r\nfoo();\r\n',
      'utf8',
    )

    const diagnostics = await runOxlint(
      ['oxlint', '--format', 'json', 'index.js'],
      dir,
    )

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.rule).toBe('eslint(no-extra-boolean-cast)')
    expect(diagnostics[0]?.loc).toEqual({
      start: { line: 2, column: 5 },
      end: { line: 2, column: 8 },
    })
    expect(diagnostics[0]?.stripedCodeFrame).toContain('if (!!x) { yy(); }')
    expect(diagnostics[0]?.stripedCodeFrame).toContain('^^^')
  })

  it('converts UTF-8 byte offsets for multi-byte characters, emojis, and UTF-8 BOM', async () => {
    const dir = await createTempDir()
    await fs.writeFile(
      path.join(dir, 'emoji.js'),
      'const a = "🚀"; if (!!x) { yy(); }\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(dir, 'bom.js'),
      '\uFEFF// åäö\r\nif (!!x) { yy(); }\r\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(dir, 'span-nonascii.js'),
      'if (!!"åäö🚀") { yy(); }\n',
      'utf8',
    )

    const diagnostics = await runOxlint(
      ['oxlint', '--format', 'json', 'emoji.js', 'bom.js', 'span-nonascii.js'],
      dir,
    )

    const emojiDiag = diagnostics.find(
      (d) =>
        d.id?.endsWith('emoji.js') &&
        d.rule === 'eslint(no-extra-boolean-cast)',
    )
    expect(emojiDiag?.loc).toEqual({
      start: { line: 1, column: 21 },
      end: { line: 1, column: 24 },
    })

    const bomDiag = diagnostics.find(
      (d) =>
        d.id?.endsWith('bom.js') && d.rule === 'eslint(no-extra-boolean-cast)',
    )
    expect(bomDiag?.loc).toEqual({
      start: { line: 2, column: 5 },
      end: { line: 2, column: 8 },
    })

    const spanNonAsciiDiag = diagnostics.find(
      (d) =>
        d.id?.endsWith('span-nonascii.js') &&
        d.rule === 'eslint(no-extra-boolean-cast)',
    )
    expect(spanNonAsciiDiag?.loc).toEqual({
      start: { line: 1, column: 5 },
      end: { line: 1, column: 14 },
    })
  })
})
