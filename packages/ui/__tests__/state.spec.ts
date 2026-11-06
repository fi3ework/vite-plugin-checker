import { describe, expect, it } from 'vitest'
import { PROTOCOL_VERSION } from '../../vite-plugin-checker/src/protocol'
import {
  applySnapshot,
  applyStatus,
  applyUpdate,
  createState,
  diagnosticsOf,
} from '../src/state'
import { diagnostic } from './fixtures'

function snapshot() {
  const state = createState()
  applySnapshot(state, {
    protocol: PROTOCOL_VERSION,
    indicatorClaimed: true,
    checkers: [
      {
        id: 'typescript',
        label: 'TypeScript',
        status: 'idle',
        diagnostics: [
          diagnostic({ id: 'a' }),
          diagnostic({ id: 'b', file: '/root/src/b.ts' }),
          diagnostic({ id: 'c', file: undefined, displayFile: undefined }),
        ],
      },
    ],
  })
  return state
}

describe('state', () => {
  it('groups snapshot diagnostics by file', () => {
    const state = snapshot()
    expect(state.connection).toBe('connected')
    expect(state.indicatorClaimed).toBe(true)
    expect(Object.keys(state.checkers[0]!.files)).toEqual([
      '/root/src/a.ts',
      '/root/src/b.ts',
      '',
    ])
  })

  it('records a protocol mismatch instead of applying the snapshot', () => {
    const state = snapshot()
    applySnapshot(state, {
      protocol: 2 as typeof PROTOCOL_VERSION,
      indicatorClaimed: false,
      checkers: [],
    })
    expect(state.mismatch).toBe(2)
    expect(state.checkers).toEqual([])
  })

  it('replaces and removes files on update', () => {
    const state = snapshot()
    applyUpdate(state, {
      checkerId: 'typescript',
      files: {
        '/root/src/a.ts': [diagnostic({ id: 'a2', message: 'Other' })],
        '/root/src/b.ts': [],
      },
    })
    expect(diagnosticsOf(state.checkers[0]!).map((d) => d.id)).toEqual([
      'a2',
      'c',
    ])
  })

  it('ignores events for unknown checkers', () => {
    const state = snapshot()
    applyUpdate(state, { checkerId: 'eslint', files: { x: [diagnostic()] } })
    applyStatus(state, { checkerId: 'eslint', status: 'checking' })
    expect(state.checkers).toHaveLength(1)
    expect(state.checkers[0]!.status).toBe('idle')
  })

  it('keeps the failure reason only while failed', () => {
    const state = snapshot()
    applyStatus(state, {
      checkerId: 'typescript',
      status: 'failed',
      error: 'boom',
      lastRun: { startedAt: 1, finishedAt: 2 },
    })
    expect(state.checkers[0]).toMatchObject({
      status: 'failed',
      error: 'boom',
      lastRun: { startedAt: 1, finishedAt: 2 },
    })

    applyStatus(state, { checkerId: 'typescript', status: 'checking' })
    expect(state.checkers[0]!.error).toBeUndefined()
    expect(state.checkers[0]!.lastRun).toEqual({ startedAt: 1, finishedAt: 2 })
  })
})
