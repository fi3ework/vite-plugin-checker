import { describe, expect, it, vi } from 'vitest'

import type { CheckerEvent, Diagnostic } from '../src/protocol'
import { createCheckerStore } from '../src/store'

function diagnostic(file: string | undefined, message: string): Diagnostic {
  return {
    id: `${file}:${message}`,
    checkerId: 'eslint',
    level: 'error',
    message,
    ...(file ? { file } : {}),
  }
}

function setup() {
  let time = 1000
  const store = createCheckerStore(() => time)
  const events: CheckerEvent[] = []
  store.subscribe((event) => events.push(event))
  store.register('eslint', 'ESLint')
  return {
    store,
    events,
    tick: (ms: number) => {
      time += ms
    },
  }
}

describe('createCheckerStore', () => {
  it('starts registered checkers with no diagnostics', () => {
    const { store } = setup()
    expect(store.getState()).toEqual([
      { id: 'eslint', label: 'ESLint', status: 'starting', diagnostics: [] },
    ])
  })

  it('records the run time of each status transition', () => {
    const { store, events, tick } = setup()

    store.setStatus('eslint', 'checking')
    tick(100)
    store.setStatus('eslint', 'checking')
    tick(150)
    store.setDiagnostics('eslint', [])
    tick(1000)
    store.setStatus('eslint', 'checking')

    expect(events).toEqual([
      {
        type: 'status',
        checkerId: 'eslint',
        label: 'ESLint',
        status: 'starting',
        lastRun: { startedAt: 1000 },
      },
      {
        type: 'status',
        checkerId: 'eslint',
        label: 'ESLint',
        status: 'idle',
        lastRun: { startedAt: 1000, finishedAt: 1250 },
      },
      {
        type: 'status',
        checkerId: 'eslint',
        label: 'ESLint',
        status: 'checking',
        lastRun: { startedAt: 2250 },
      },
    ])
  })

  it('emits only the files whose diagnostics changed', () => {
    const { store, events } = setup()
    const a = diagnostic('/p/a.ts', 'a')
    const b = diagnostic('/p/b.ts', 'b')
    const loose = diagnostic(undefined, 'no file')

    store.setDiagnostics('eslint', [a, b, loose])
    events.length = 0

    const b2 = diagnostic('/p/b.ts', 'b changed')
    store.setDiagnostics('eslint', [a, b2])

    expect(events.filter((e) => e.type === 'update')).toEqual([
      {
        type: 'update',
        checkerId: 'eslint',
        files: { '/p/b.ts': [b2], '': [] },
      },
    ])
    expect(store.getState()[0]!.diagnostics).toEqual([a, b2])
  })

  it('emits only the finished run when an identical set is republished', () => {
    const { store, events, tick } = setup()
    const a = diagnostic('/p/a.ts', 'a')

    store.setDiagnostics('eslint', [a])
    events.length = 0
    tick(500)
    store.setDiagnostics('eslint', [{ ...a }])

    expect(events).toEqual([
      {
        type: 'status',
        checkerId: 'eslint',
        label: 'ESLint',
        status: 'idle',
        lastRun: { startedAt: 1500, finishedAt: 1500 },
      },
    ])
  })

  it('keeps the failure reason only while failed', () => {
    const { store, events } = setup()

    store.setStatus('eslint', 'failed', 'Cannot find module eslint')
    expect(store.getState()[0]).toMatchObject({
      status: 'failed',
      error: 'Cannot find module eslint',
    })

    store.setStatus('eslint', 'checking')
    expect(store.getState()[0]).not.toHaveProperty('error')
    expect(events.map((e) => e.type === 'status' && e.error)).toEqual([
      'Cannot find module eslint',
      undefined,
    ])
  })

  it('isolates listeners that throw', () => {
    const store = createCheckerStore()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const listener = vi.fn()
    store.subscribe(() => {
      throw new Error('boom')
    })
    store.subscribe(listener)
    store.register('eslint', 'ESLint')

    store.setStatus('eslint', 'checking')

    expect(listener).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledOnce()
    error.mockRestore()
  })

  it('stops notifying unsubscribed listeners', () => {
    const store = createCheckerStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.register('eslint', 'ESLint')

    unsubscribe()
    store.setStatus('eslint', 'checking')

    expect(listener).not.toHaveBeenCalled()
  })
})
