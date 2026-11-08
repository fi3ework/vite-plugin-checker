import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listen } from '../src/connection'
import { createDemoServer } from '../src/demo/server'
import { createState, diagnosticsOf } from '../src/state'

describe('demo server', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function connect(server: ReturnType<typeof createDemoServer>) {
    const state = createState()
    listen(state, server.hot())
    const ids = () =>
      state.checkers
        .flatMap(diagnosticsOf)
        .map((d) => d.id)
        .sort()
    const statuses = () => state.checkers.map((c) => c.status)
    return { state, ids, statuses }
  }

  it('should replay the session and remove the fixed diagnostic', () => {
    const server = createDemoServer()
    const { state, ids, statuses } = connect(server)
    expect(state.connection).toBe('connected')
    expect(statuses()).toEqual(['starting', 'starting'])

    vi.advanceTimersByTime(1800)
    expect(statuses()).toEqual(['idle', 'idle'])
    expect(ids()).toEqual([
      'eslint-any',
      'eslint-no-var',
      'ts-argument',
      'ts-typo',
    ])

    vi.advanceTimersByTime(5200)
    expect(statuses()).toEqual(['checking', 'idle'])

    vi.advanceTimersByTime(800)
    expect(statuses()).toEqual(['idle', 'idle'])
    expect(ids()).toEqual(['eslint-any', 'eslint-no-var', 'ts-argument'])
    expect(state.checkers[0]!.files['/project/src/user.ts']).toBeUndefined()

    expect(connect(server).state).toEqual(state)
    server.close()
  })

  it('should stop the replay when closed', () => {
    const server = createDemoServer()
    const { ids, statuses } = connect(server)
    server.close()
    vi.advanceTimersByTime(10_000)
    expect(statuses()).toEqual(['starting', 'starting'])
    expect(ids()).toEqual([])
  })
})
