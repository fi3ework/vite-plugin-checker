import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { pruneMissingFiles } from '../src/checkers/_shared/pruneMissingFiles'
import { FileDiagnosticManager } from '../src/FileDiagnosticManager'
import type { NormalizedDiagnostic } from '../src/logger'

function diag(id: string): NormalizedDiagnostic {
  return { id, message: 'oops', checker: 'test' } as NormalizedDiagnostic
}

describe('pruneMissingFiles', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-prune-'))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('keeps diagnostics for files that exist', () => {
    const file = path.join(root, 'a.js')
    fs.writeFileSync(file, '')
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(file), diag(file)])
    pruneMissingFiles(manager)
    expect(manager.getDiagnostics()).toHaveLength(2)
  })

  it('clears diagnostics for deleted files and missing directories', () => {
    const kept = path.join(root, 'kept.js')
    fs.writeFileSync(kept, '')
    const manager = new FileDiagnosticManager()
    manager.initWith([
      diag(kept),
      diag(path.join(root, 'deleted.js')),
      diag(path.join(root, 'gone', 'b.js')),
    ])
    pruneMissingFiles(manager)
    expect(manager.getDiagnostics().map((d) => d.id)).toEqual([kept])
  })

  it('clears diagnostics after a case-only rename', () => {
    fs.writeFileSync(path.join(root, 'Index.js'), '')
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(path.join(root, 'index.js'))])
    pruneMissingFiles(manager)
    expect(manager.getDiagnostics()).toHaveLength(0)
  })

  it('ignores diagnostics without a file id', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([diag('')])
    pruneMissingFiles(manager)
    expect(manager.getDiagnostics()).toHaveLength(1)
  })
})
