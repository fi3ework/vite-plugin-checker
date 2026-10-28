import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { execa } from 'execa'
import { unpackTar } from 'modern-tar'
import invariant from 'tiny-invariant'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../..')

describe('npm pack', () => {
  let tarballFiles: string[]
  let archive: Awaited<ReturnType<typeof unpackTar>>
  let dest: string

  beforeAll(async () => {
    dest = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-pack-'))
    const { stdout } = await execa(
      'pnpm',
      ['pack', '--config.ignore-scripts=true', '--pack-destination', dest],
      {
        cwd: packageRoot,
      },
    )
    const tarball = stdout.trim().split('\n').at(-1)!
    archive = await unpackTar(gunzipSync(fs.readFileSync(tarball)))
    tarballFiles = archive.map((entry) => entry.header.name)
  }, 60_000)

  afterAll(() => {
    fs.rmSync(dest, { force: true, recursive: true })
  })

  it('publishes the runtime bundle the client resolves at runtime', () => {
    expect(tarballFiles).toContain('package/dist/@runtime/main.js')
  })

  it('bundles Vue in production mode', () => {
    const runtimeEntry = archive.find(
      (entry) => entry.header.name === 'package/dist/@runtime/main.js',
    )
    invariant(runtimeEntry?.data, 'runtime bundle is expected in the tarball')
    const code = new TextDecoder().decode(runtimeEntry.data)

    expect(code).not.toContain('process.env.NODE_ENV')
    expect(code).not.toContain('__VUE_HMR_RUNTIME__')
    expect(code).not.toContain('devtoolsInitApp')
  })
})
