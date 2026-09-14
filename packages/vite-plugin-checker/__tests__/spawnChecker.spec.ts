import { beforeEach, describe, expect, it, vi } from 'vitest'

import { spawnChecker } from '../src/main'
import type { ServeAndBuildChecker } from '../src/types'

// `vi.mock` is hoisted above the import, so `spawn` is stubbed before main loads.
const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }))

vi.mock('node:child_process', () => ({ spawn: spawnMock }))

beforeEach(() => {
  spawnMock.mockReset()
  spawnMock.mockReturnValue({
    on: (event: string, cb: (code: number) => void) => {
      if (event === 'exit') cb(0)
    },
  })
})

const makeChecker = (buildBin: ServeAndBuildChecker['build']['buildBin']) =>
  ({ build: { buildBin } }) as ServeAndBuildChecker

describe('spawnChecker', () => {
  it('runs the build command from the provided cwd', async () => {
    await spawnChecker(
      makeChecker(['tsc', ['--noEmit']]),
      {},
      {},
      '/monorepo/packages/app',
    )

    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock).toHaveBeenCalledWith(
      'tsc --noEmit',
      expect.objectContaining({ cwd: '/monorepo/packages/app' }),
    )
  })

  it('resolves a function buildBin against userConfig', async () => {
    await spawnChecker(
      makeChecker((config) => ['eslint', [config.root ?? '.']]),
      { root: '/monorepo' },
      {},
      '/monorepo',
    )

    expect(spawnMock).toHaveBeenCalledWith(
      'eslint /monorepo',
      expect.objectContaining({ cwd: '/monorepo' }),
    )
  })
})
