import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { forceNoEmitOnSolutionBuilderHost } from '../src/checkers/tscUtils'

describe('forceNoEmitOnSolutionBuilderHost', () => {
  let tmp: string

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-tscutils-'))
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

  it('forces noEmit on a well-formed referenced project', () => {
    const refPath = path.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(
      refPath,
      JSON.stringify({
        compilerOptions: { target: 'ESNext', noEmit: false, composite: true },
        include: ['main.ts'],
      }),
    )
    fs.writeFileSync(path.join(tmp, 'main.ts'), 'export const x = 1\n')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.options.noEmit).toBe(true)
  })

  it('returns undefined for a missing referenced project', () => {
    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    expect(
      host.getParsedCommandLine!(path.join(tmp, 'does-not-exist.json')),
    ).toBeUndefined()
  })

  it('forces noEmit even when the referenced project is empty', () => {
    const refPath = path.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(refPath, '')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.options.noEmit).toBe(true)
  })

  it('forces noEmit even when the referenced project is partial JSON', () => {
    const refPath = path.join(tmp, 'tsconfig.app.json')
    fs.writeFileSync(refPath, '{\n  "compilerOptions": {')

    const host = forceNoEmitOnSolutionBuilderHost(ts, makeHost())
    const parsed = host.getParsedCommandLine!(refPath)

    expect(parsed).toBeDefined()
    expect(parsed!.options.noEmit).toBe(true)
  })
})
