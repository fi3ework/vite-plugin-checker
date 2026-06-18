import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { forceNoEmitOnSolutionBuilderHost } from '../src/checkers/tscUtils'

describe('forceNoEmitOnSolutionBuilderHost', () => {
  let tmp: string

  beforeEach(() => {
    // forward slashes match what TS's canonical file names look like; using a
    // mixed-slash path on Windows trips an internal TS Debug.assert when it
    // attaches diagnostics to a failed parse.
    tmp = fs
      .mkdtempSync(path.join(os.tmpdir(), 'vpc-tscutils-'))
      .replace(/\\/g, '/')
  })

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  function makeHost() {
    return ts.createSolutionBuilderWithWatchHost(
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    )
  }

  it('leaves a well-formed referenced project untouched', () => {
    const refPath = path.posix.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(
      refPath,
      JSON.stringify({
        compilerOptions: { target: 'ESNext', noEmit: false, composite: true },
        include: ['main.ts'],
      }),
    )
    fs.writeFileSync(path.posix.join(tmp, 'main.ts'), 'export const x = 1\n')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.errors).toHaveLength(0)
    // a valid composite referenced project must be allowed to emit; forcing
    // noEmit here would break `tsc --build` invariants.
    expect(parsed!.options.noEmit).toBe(false)
  })

  it('returns undefined for a missing referenced project', () => {
    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    expect(
      host.getParsedCommandLine!(path.posix.join(tmp, 'does-not-exist.json')),
    ).toBeUndefined()
  })

  it('forces noEmit even when the referenced project is empty', () => {
    const refPath = path.posix.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(refPath, '')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.options.noEmit).toBe(true)
  })

  it('forces noEmit even when the referenced project is partial JSON', () => {
    const refPath = path.posix.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(refPath, '{\n  "compilerOptions": {')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.options.noEmit).toBe(true)
  })

  it('builds a referenced project whose include resolves to only `.d.ts` files', () => {
    const leafDir = path.posix.join(tmp, 'leaf')
    fs.mkdirSync(leafDir, { recursive: true })
    fs.writeFileSync(path.posix.join(leafDir, 'types.d.ts'), 'export {}\n')
    fs.writeFileSync(
      path.posix.join(leafDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { noEmit: true, composite: false },
        include: ['./types.d.ts'],
      }),
    )

    const rootPath = path.posix.join(tmp, 'tsconfig.json')
    fs.writeFileSync(
      rootPath,
      JSON.stringify({
        files: [],
        references: [{ path: './leaf/tsconfig.json' }],
      }),
    )

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const builder = ts.createSolutionBuilderWithWatch(host, [rootPath], {})
    expect(() => builder.build()).not.toThrow()
  })
})
