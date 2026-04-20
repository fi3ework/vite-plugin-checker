import { describe, expect, it, vi } from 'vitest'

import { applyBatchedDiagnostics } from '../src/checkers/_shared/applyBatchedDiagnostics'
import { FileDiagnosticManager } from '../src/FileDiagnosticManager'
import type { NormalizedDiagnostic } from '../src/logger'

const ROOT = '/repo'
const fileA = '/repo/src/a.ts'
const fileB = '/repo/src/b.ts'
const fileC = '/repo/src/c.ts'

function diag(id: string, message: string): NormalizedDiagnostic {
  return {
    id,
    message,
    checker: 'test',
  } as NormalizedDiagnostic
}

describe('applyBatchedDiagnostics', () => {
  it('empty batch + empty diagnostics produces no manager calls', () => {
    const manager = new FileDiagnosticManager()
    const spy = vi.spyOn(manager, 'updateByFileId')
    applyBatchedDiagnostics(manager, [], [], ROOT)
    expect(spy).not.toHaveBeenCalled()
  })

  it('routes a diagnostic to the matching file in the batch', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    applyBatchedDiagnostics(manager, [fileA], [diag(fileA, 'oops')], ROOT)
    expect(manager.getDiagnostics(fileA)).toHaveLength(1)
    expect(manager.getDiagnostics(fileA)[0]?.message).toBe('oops')
  })

  it('clears stale diagnostics for files in the batch with no new diagnostics', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(fileA, 'stale-a'), diag(fileB, 'stale-b')])
    applyBatchedDiagnostics(
      manager,
      [fileA, fileB],
      [diag(fileA, 'new-a')],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'new-a',
    ])
    // fileB was in the batch, linter returned nothing → stale cleared
    expect(manager.getDiagnostics(fileB)).toEqual([])
  })

  it('does not touch files outside the batch', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([diag(fileC, 'untouched')])
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [diag(fileA, 'a'), diag(fileC, 'ignored')],
      ROOT,
    )
    // fileC was not in the batch; its prior diagnostic must remain,
    // and the spurious diagnostic for fileC from the linter is ignored.
    expect(manager.getDiagnostics(fileC).map((d) => d.message)).toEqual([
      'untouched',
    ])
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual(['a'])
  })

  it('normalizes paths on both sides before bucketing', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    // diagnostic id has a trailing separator + unresolved . segment
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [diag('/repo/src/./a.ts', 'normed')],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'normed',
    ])
  })

  it('drops diagnostics with undefined or empty id without crashing', () => {
    const manager = new FileDiagnosticManager()
    manager.initWith([])
    applyBatchedDiagnostics(
      manager,
      [fileA],
      [
        { checker: 'test', message: 'no-id' } as NormalizedDiagnostic,
        {
          id: '',
          checker: 'test',
          message: 'empty-id',
        } as NormalizedDiagnostic,
        diag(fileA, 'keeper'),
      ],
      ROOT,
    )
    expect(manager.getDiagnostics(fileA).map((d) => d.message)).toEqual([
      'keeper',
    ])
  })
})
