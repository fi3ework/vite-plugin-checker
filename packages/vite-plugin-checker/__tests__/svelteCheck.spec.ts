import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  createMachineOutputParser,
  getDevArgs,
} from '../src/checkers/svelteCheck/cli'
import type { NormalizedDiagnostic } from '../src/logger'
import { DiagnosticLevel } from '../src/types'

const root = path.resolve('/repo')

describe('svelte-check getDevArgs', () => {
  it('runs in watch mode with machine output against the vite root', () => {
    expect(getDevArgs('', root)).toEqual([
      '--workspace',
      root,
      '--watch',
      '--output',
      'machine-verbose',
    ])
  })

  it('keeps user flags and drops the ones managed by the plugin', () => {
    expect(
      getDevArgs(
        '--tsconfig ./tsconfig.app.json --output human --watch --preserveWatchOutput --output=human-verbose --threshold error',
        root,
      ),
    ).toEqual([
      '--tsconfig',
      './tsconfig.app.json',
      '--threshold',
      'error',
      '--workspace',
      root,
      '--watch',
      '--output',
      'machine-verbose',
    ])
  })

  it('resolves a user workspace against the vite root', () => {
    expect(getDevArgs('--workspace ./app', root).slice(0, 2)).toEqual([
      '--workspace',
      path.join(root, 'app'),
    ])
    expect(getDevArgs('--workspace=app', root).slice(0, 2)).toEqual([
      '--workspace',
      path.join(root, 'app'),
    ])
  })
})

describe('svelte-check machine output parser', () => {
  function collect() {
    const runs: NormalizedDiagnostic[][] = []
    const failures: string[] = []
    let resolveNext: () => void = () => {}
    const parser = createMachineOutputParser({
      onComplete: (d) => {
        runs.push(d)
        resolveNext()
      },
      onFailure: (m) => failures.push(m),
    })
    const nextRun = () =>
      new Promise<void>((resolve) => {
        resolveNext = resolve
      })
    return { parser, runs, failures, nextRun }
  }

  it('emits each completed run with absolute paths and 1-based locations', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'svelte-check-'))
    fs.mkdirSync(path.join(workspace, 'src'))
    fs.writeFileSync(
      path.join(workspace, 'src/App.svelte'),
      `<script lang="ts">\n  let count: number = 'hello'\n</script>\n`,
    )
    const { parser, runs, nextRun } = collect()

    const done = nextRun()
    for (const line of [
      `1 START ${JSON.stringify(workspace)}`,
      `2 {"type":"ERROR","filename":"src/App.svelte","start":{"line":1,"character":6},"end":{"line":1,"character":11},"message":"Type 'string' is not assignable to type 'number'.","code":2322,"source":"ts"}`,
      `3 {"type":"WARNING","filename":"src/App.svelte","start":{"line":0,"character":0},"end":{"line":0,"character":1},"message":"Unused thing\\nhttps://svelte.dev/e/unused_thing","code":"unused_thing","source":"svelte"}`,
      '4 COMPLETED 1 FILES 1 ERRORS 1 WARNINGS 1 FILES_WITH_PROBLEMS',
    ]) {
      parser.push(line)
    }
    await done

    const [diagnostics] = runs
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics![0]).toMatchObject({
      id: path.join(workspace, 'src/App.svelte'),
      checker: 'svelte-check',
      level: DiagnosticLevel.Error,
      message: "Type 'string' is not assignable to type 'number'. (TS2322)",
      loc: { start: { line: 2, column: 7 }, end: { line: 2, column: 12 } },
    })
    expect(diagnostics![0]!.stripedCodeFrame).toContain(
      "let count: number = 'hello'",
    )
    expect(diagnostics![1]).toMatchObject({
      level: DiagnosticLevel.Warning,
      message: 'Unused thing\nhttps://svelte.dev/e/unused_thing',
    })

    const next = nextRun()
    parser.push(`5 START ${JSON.stringify(workspace)}`)
    parser.push('6 COMPLETED 1 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS')
    await next
    expect(runs[1]).toEqual([])

    fs.rmSync(workspace, { recursive: true, force: true })
  })

  it('reports failures and ignores unrelated output', () => {
    const { parser, runs, failures } = collect()
    parser.push('Loading svelte-check in workspace')
    parser.push('7 FAILURE "No tsconfig found"')
    expect(failures).toEqual(['No tsconfig found'])
    expect(runs).toEqual([])
  })
})
