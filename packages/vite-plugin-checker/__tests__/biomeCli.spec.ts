import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  parseBiomeOutput,
  sanitizeBiomeOutput,
} from '../src/checkers/biome/cli'
import { normalizePath } from '../src/sources'

const source = 'const value = 1\n'

function modernDiagnostic(file: string, message = 'diagnostic message') {
  return {
    severity: 'error',
    message,
    category: 'lint/test',
    location: {
      path: file,
      start: { line: 1, column: 1 },
      end: { line: 1, column: 6 },
    },
    advices: [],
  }
}

function biomeOutputWithRawPaths(
  diagnostics: Record<string, unknown>[],
  paths: string[],
) {
  let output = JSON.stringify({ diagnostics })

  for (const [index, file] of paths.entries()) {
    output = output.replace(
      JSON.stringify(`__RAW_PATH_${index}__`),
      `"${file}"`,
    )
  }

  return output
}

describe('Biome Windows paths', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'vite-plugin-checker-biome-'))
  })

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  async function writeModernSource(file: string) {
    const normalized = normalizePath(file, cwd)
    await mkdir(dirname(normalized), { recursive: true })
    await writeFile(normalized, source)
    return normalized
  }

  it.each([
    String.raw`src\util.ts`,
    String.raw`src\test.ts`,
    String.raw`src\new.ts`,
    String.raw`src\routes.ts`,
    String.raw`src\button.ts`,
    String.raw`src\form.ts`,
  ])('keeps a raw Windows path literal: %s', async (file) => {
    const normalized = await writeModernSource(file)
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [file],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('keeps a raw drive path literal', async () => {
    const file =
      process.platform === 'win32'
        ? join(cwd, 'src', 'drive.ts')
        : String.raw`C:\src\drive.ts`
    const normalized = await writeModernSource(file)
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [file],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('repairs a reordered modern location', async () => {
    const file = String.raw`src\util\test.ts`
    const normalized = await writeModernSource(file)
    const output = biomeOutputWithRawPaths(
      [
        {
          severity: 'error',
          message: 'diagnostic message',
          category: 'lint/test',
          location: {
            start: { line: 1, column: 1 },
            path: '__RAW_PATH_0__',
            end: { line: 1, column: 6 },
          },
          advices: [],
        },
      ],
      [file],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('keeps a raw UNC path literal', () => {
    const file = String.raw`\\server\share\util.ts`
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [file],
    )

    const parsed = JSON.parse(sanitizeBiomeOutput(output))

    expect(parsed.diagnostics[0].location.path).toBe(file)
  })

  it('does not change correctly escaped Windows paths', () => {
    const drive = String.raw`C:\src\util.ts`
    const unc = String.raw`\\server\share\util.ts`
    const rootRelative = String.raw`\src\util.ts`
    const output = JSON.stringify({
      diagnostics: [
        modernDiagnostic(drive),
        modernDiagnostic(unc),
        modernDiagnostic(rootRelative),
      ],
    })

    const sanitized = sanitizeBiomeOutput(output)

    expect(sanitized).toBe(output)
    const parsed = JSON.parse(sanitized) as {
      diagnostics: { location: { path: string } }[]
    }
    expect(parsed.diagnostics.map((item) => item.location.path)).toEqual([
      drive,
      unc,
      rootRelative,
    ])
  })

  it('repairs every raw path in an output with multiple diagnostics', async () => {
    const files = [String.raw`src\util.ts`, String.raw`test\button.ts`]
    const normalized = await Promise.all(files.map(writeModernSource))
    const output = biomeOutputWithRawPaths(
      files.map((_, index) => modernDiagnostic(`__RAW_PATH_${index}__`)),
      files,
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics.map((item) => item.id)).toEqual(normalized)
  })

  it('repairs a raw legacy object path', async () => {
    const file = String.raw`src\util\test.ts`
    const output = biomeOutputWithRawPaths(
      [
        {
          severity: 'error',
          description: 'legacy diagnostic',
          category: 'lint/test',
          location: {
            path: { file: '__RAW_PATH_0__' },
            sourceCode: source,
            span: [0, 5],
          },
        },
      ],
      [file],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalizePath(file, cwd))
  })

  it('repairs a reordered legacy path object', async () => {
    const file = String.raw`src\util\test.ts`
    const output = biomeOutputWithRawPaths(
      [
        {
          severity: 'error',
          description: 'legacy diagnostic',
          category: 'lint/test',
          location: {
            path: { kind: 'file', file: '__RAW_PATH_0__' },
            sourceCode: source,
            span: [0, 5],
          },
        },
      ],
      [file],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalizePath(file, cwd))
  })

  it('does not sanitize location paths outside direct diagnostic locations', () => {
    const paths = [String.raw`metadata\util.ts`, String.raw`advice\test.ts`]
    const output = biomeOutputWithRawPaths(
      [
        {
          ...modernDiagnostic('src/util.ts'),
          advices: [
            {
              location: { path: '__RAW_PATH_1__' },
              text: 'nested advice',
            },
          ],
        },
      ],
      [paths[0]!, paths[1]!],
    ).replace(
      '"diagnostics":',
      `"metadata":{"location":{"path":"${paths[0]}"}},"diagnostics":`,
    )

    expect(sanitizeBiomeOutput(output)).toBe(output)
  })

  it('preserves legal JSON escapes in a path', () => {
    const output = String.raw`{"diagnostics":[{"severity":"error","message":"diagnostic message","category":"lint/test","location":{"path":"src\/caf\u00e9\"quote.ts","start":{"line":1,"column":1},"end":{"line":1,"column":6}},"advices":[]}]}`

    expect(sanitizeBiomeOutput(output)).toBe(output)
    expect(JSON.parse(output).diagnostics[0].location.path).toBe(
      'src/café"quote.ts',
    )
  })

  it('uses a raw unicode-looking path when only that source exists', async () => {
    const rawFile = String.raw`src\u1234.ts`
    const normalized = await writeModernSource(rawFile)
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [rawFile],
    )

    expect(sanitizeBiomeOutput(output)).toBe(output)
    const diagnostics = await parseBiomeOutput(output, cwd)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('uses standard JSON unicode semantics when that source exists', async () => {
    const rawFile = String.raw`src\u1234.ts`
    const unicodeFile = 'src\u1234.ts'
    const normalized = await writeModernSource(unicodeFile)
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [rawFile],
    )

    expect(sanitizeBiomeOutput(output)).toBe(output)
    const diagnostics = await parseBiomeOutput(output, cwd)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('prefers standard JSON unicode semantics when both sources exist', async () => {
    const rawFile = String.raw`src\u1234.ts`
    const unicodeFile = 'src\u1234.ts'
    await writeModernSource(rawFile)
    const normalized = await writeModernSource(unicodeFile)
    const output = biomeOutputWithRawPaths(
      [modernDiagnostic('__RAW_PATH_0__')],
      [rawFile],
    )

    const diagnostics = await parseBiomeOutput(output, cwd)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('leaves Unix paths unchanged', async () => {
    const file = 'src/util.ts'
    const normalized = await writeModernSource(file)
    const output = JSON.stringify({ diagnostics: [modernDiagnostic(file)] })

    expect(sanitizeBiomeOutput(output)).toBe(output)
    const diagnostics = await parseBiomeOutput(output, cwd)
    expect(diagnostics[0]?.id).toBe(normalized)
  })

  it('does not change unrelated JSON strings', async () => {
    const file = String.raw`src\util.ts`
    await writeModernSource(file)
    const message = 'first line\nC:\\docs\\readme.md says "hello"'
    const output = JSON.stringify({
      diagnostics: [modernDiagnostic(file, message)],
      summary: String.raw`C:\reports\summary.txt`,
    })

    expect(sanitizeBiomeOutput(output)).toBe(output)
    const diagnostics = await parseBiomeOutput(output, cwd)
    expect(diagnostics[0]?.message).toBe(`[lint/test] ${message}`)
  })
})
