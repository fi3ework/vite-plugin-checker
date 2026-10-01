import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, it } from 'vitest'
import { normalizePath, readSources } from '../src/sources'

it.each([
  'with space.ts',
  'percent%.ts',
  'hash#.ts',
  '中文.ts',
])('reads a diagnostic file URL for %s', async (name) => {
  const root = await mkdtemp(path.join(tmpdir(), 'checker-url-'))
  try {
    const file = path.join(root, name)
    await writeFile(file, 'debugger;\n')
    const normalized = normalizePath(pathToFileURL(file).href, root)
    expect(normalized).toBe(file)
    expect((await readSources([normalized])).get(normalized)).toBe(
      await readFile(file, 'utf8'),
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it('leaves ordinary relative and absolute paths unchanged', () => {
  const root = path.resolve('/project')
  expect(normalizePath('src/a%20.ts', root)).toBe(
    path.join(root, 'src/a%20.ts'),
  )
  expect(normalizePath(path.join(root, 'src/a.ts'), root)).toBe(
    path.join(root, 'src/a.ts'),
  )
})
