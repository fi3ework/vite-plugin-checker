import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../..')

describe('prepareVueTsc', () => {
  const tempDir = fs.mkdtempSync(path.join(packageRoot, '.prepare-vue-tsc-'))
  const fixturesDir = path.join(tempDir, 'typescript-vue-tsc')
  let prepareVueTsc: () => Promise<{ targetTsDir: string }>

  beforeAll(async () => {
    const entry = path.join(tempDir, 'prepareVueTsc.js')
    fs.copyFileSync(
      path.join(packageRoot, 'dist/checkers/vueTsc/prepareVueTsc.js'),
      entry,
    )
    ;({ prepareVueTsc } = await import(pathToFileURL(entry).href))
  })

  afterAll(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  it('builds a single complete fixture when called concurrently', async () => {
    fs.mkdirSync(path.join(fixturesDir, 'stale'), { recursive: true })

    const results = await Promise.all(
      Array.from({ length: 4 }, () => prepareVueTsc()),
    )
    const { targetTsDir } = results[0]!

    expect(results.map((r) => r.targetTsDir)).toEqual(
      Array(4).fill(targetTsDir),
    )
    expect(fs.readdirSync(fixturesDir)).toEqual([path.basename(targetTsDir)])
    expect(
      fs.readFileSync(path.join(targetTsDir, 'lib/typescript.js'), 'utf8'),
    ).toContain('proxyCreateProgram')
    await expect(prepareVueTsc()).resolves.toEqual({ targetTsDir })
  })
})
