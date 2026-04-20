import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLintScheduler } from '../src/checkers/_shared/lintScheduler'

const DEBOUNCE = 300

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Flushes queued microtasks so that `.then`/`.finally` chains settle.
async function tick() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('createLintScheduler', () => {
  it('debounces a single scheduled file into one onBatch call', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    expect(onBatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith(['/r/a'])
  })

  it('coalesces multiple files within the debounce window', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    s.schedule('/r/b')
    s.schedule('/r/c')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch.mock.calls[0]?.[0]?.sort()).toEqual(['/r/a', '/r/b', '/r/c'])
  })

  it('dedupes repeated schedules of the same file', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    s.schedule('/r/a')
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith(['/r/a'])
  })

  it('coalesces events arriving during an in-flight run into a follow-up batch', async () => {
    let resolveFirst: () => void = () => {}
    const firstPromise = new Promise<void>((r) => {
      resolveFirst = r
    })
    const onBatch = vi
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce(undefined)

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenNthCalledWith(1, ['/r/a'])

    // Arrive during in-flight: should accumulate, not fire a concurrent call.
    s.schedule('/r/b')
    s.schedule('/r/c')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1) // still only the first call

    resolveFirst()
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(2)
    expect(onBatch.mock.calls[1]?.[0]?.sort()).toEqual(['/r/b', '/r/c'])
  })

  it('never has two onBatch calls in flight simultaneously', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const onBatch = vi.fn().mockImplementation(async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await Promise.resolve()
      inFlight--
    })

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    for (let i = 0; i < 10; i++) {
      s.schedule(`/r/${i}`)
      vi.advanceTimersByTime(DEBOUNCE / 2)
    }
    vi.advanceTimersByTime(DEBOUNCE)
    // Flush enough microtasks to drain any cascade.
    for (let i = 0; i < 20; i++) await tick()

    expect(maxInFlight).toBe(1)
  })

  it('dispose() while in-flight resolves only after the batch settles', async () => {
    let resolveBatch: () => void = () => {}
    const onBatch = vi.fn().mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolveBatch = r
        }),
    )

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)

    const disposed = s.dispose()
    let resolved = false
    disposed.then(() => {
      resolved = true
    })
    await tick()
    expect(resolved).toBe(false)

    resolveBatch()
    await tick()
    expect(resolved).toBe(true)
  })

  it('dispose() with pending timer but no in-flight resolves immediately and discards pending', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')

    await s.dispose()

    // Advance past where the timer would have fired; onBatch must not run.
    vi.advanceTimersByTime(DEBOUNCE * 5)
    await tick()
    expect(onBatch).not.toHaveBeenCalled()
  })

  it('schedule() after dispose() is a safe no-op', async () => {
    const onBatch = vi.fn().mockResolvedValue(undefined)
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    await s.dispose()

    expect(() => s.schedule('/r/a')).not.toThrow()
    vi.advanceTimersByTime(DEBOUNCE * 5)
    await tick()
    expect(onBatch).not.toHaveBeenCalled()
  })

  it('recovers from a rejecting onBatch and accepts new schedules', async () => {
    const err = new Error('boom')
    const onBatch = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce(undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalled()

    s.schedule('/r/b')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(2)
    expect(onBatch).toHaveBeenNthCalledWith(2, ['/r/b'])
  })

  it('dispose() does not reject even if in-flight onBatch rejects', async () => {
    const err = new Error('boom')
    let rejectBatch: (e: Error) => void = () => {}
    const onBatch = vi.fn().mockImplementation(
      () =>
        new Promise<void>((_, r) => {
          rejectBatch = r
        }),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()

    const disposed = s.dispose()
    rejectBatch(err)

    // dispose() must resolve (not reject) despite the in-flight batch rejecting.
    await expect(disposed).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('dispose() awaits a never-resolving onBatch (observable contract)', async () => {
    const onBatch = vi
      .fn()
      .mockImplementation(() => new Promise<void>(() => {}))
    const s = createLintScheduler({ debounceMs: DEBOUNCE, onBatch })
    s.schedule('/r/a')
    vi.advanceTimersByTime(DEBOUNCE)
    await tick()
    expect(onBatch).toHaveBeenCalledTimes(1)

    const disposed = s.dispose()
    let resolved = false
    disposed.then(() => {
      resolved = true
    })
    for (let i = 0; i < 5; i++) await tick()
    expect(resolved).toBe(false)
    // No assertion that it ever resolves — contract is: callers must resolve onBatch.
  })
})
