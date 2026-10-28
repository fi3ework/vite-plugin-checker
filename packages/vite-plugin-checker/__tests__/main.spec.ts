import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  wrapVirtualPrefix,
} from '../src/client'
import { checker } from '../src/main'
import type { UserPluginConfig } from '../src/types'

const { spawnMock, buildBinMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  buildBinMock: vi.fn(() => ['tsc', ['--noEmit']] as const),
}))

vi.mock('node:child_process', () => ({ spawn: spawnMock }))

vi.mock('../src/checkers/typescript/main', () => ({
  createServeAndBuild: () => ({
    serve: {
      config: vi.fn(),
      configureServer: vi.fn(),
      worker: { on: vi.fn(), off: vi.fn() },
    },
    build: { buildBin: buildBinMock },
  }),
}))

interface FilteredHook {
  filter: { id: RegExp }
  handler: (id: string) => unknown
}

function getHook(name: 'resolveId' | 'load') {
  return checker({})[name] as unknown as FilteredHook
}

const runtimeIds = [
  RUNTIME_CLIENT_RUNTIME_PATH,
  RUNTIME_CLIENT_ENTRY_PATH,
] as const

const unrelatedIds = [
  '/src/main.js',
  `${RUNTIME_CLIENT_RUNTIME_PATH}?import`,
  `/foo${RUNTIME_CLIENT_ENTRY_PATH}.js`,
]

describe('resolveId', () => {
  const hook = getHook('resolveId')

  it('resolves runtime ids to virtual ids', () => {
    for (const id of runtimeIds) {
      expect(hook.filter.id.test(id)).toBe(true)
      expect(hook.handler(id)).toBe(wrapVirtualPrefix(id))
    }
  })

  it('ignores other ids when the filter is not applied', () => {
    for (const id of unrelatedIds) {
      expect(hook.filter.id.test(id)).toBe(false)
      expect(hook.handler(id)).toBeUndefined()
    }
  })
})

describe('load', () => {
  const hook = getHook('load')

  it('matches only the virtual runtime ids', () => {
    for (const id of runtimeIds) {
      expect(hook.filter.id.test(wrapVirtualPrefix(id))).toBe(true)
    }
    for (const id of unrelatedIds) {
      expect(hook.filter.id.test(id)).toBe(false)
      expect(hook.handler(id)).toBeUndefined()
    }
  })
})

describe('build mode', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    spawnMock.mockReturnValue({
      on: (event: string, cb: (code: number) => void) => {
        if (event === 'exit') cb(0)
      },
    })
    buildBinMock.mockClear()
  })

  async function runBuild(userConfig: UserPluginConfig, viteRoot: string) {
    const plugin = checker(userConfig) as any
    await plugin.config({}, { command: 'build', mode: 'production' })
    plugin.configResolved({
      root: viteRoot,
      base: '/',
      command: 'build',
      isProduction: true,
      logger: {},
      server: {},
      build: { watch: null },
    })
    plugin.buildStart()
    await plugin.buildEnd()
  }

  it('runs checkers from the Vite root', async () => {
    await runBuild({ typescript: true }, '/monorepo/packages/app')

    expect(buildBinMock).toHaveBeenCalledWith(expect.anything(), {
      root: '/monorepo/packages/app',
    })
    expect(spawnMock).toHaveBeenCalledWith(
      'tsc --noEmit',
      expect.objectContaining({ cwd: '/monorepo/packages/app' }),
    )
  })

  it('prefers the plugin root option over the Vite root', async () => {
    await runBuild(
      { typescript: true, root: '/monorepo' },
      '/monorepo/packages/app',
    )

    expect(buildBinMock).toHaveBeenCalledWith(expect.anything(), {
      root: '/monorepo',
    })
    expect(spawnMock).toHaveBeenCalledWith(
      'tsc --noEmit',
      expect.objectContaining({ cwd: '/monorepo' }),
    )
  })
})

describe('configureServer', () => {
  it('does not clear the terminal on file changes', async () => {
    const clearScreen = vi.fn()
    const logger = {
      clearScreen,
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }
    const plugin = checker({ typescript: true }) as any

    await plugin.config({}, { command: 'serve', mode: 'development' })
    plugin.configResolved({
      root: '/project',
      base: '/',
      command: 'serve',
      isProduction: false,
      logger,
      server: { origin: undefined },
      build: { watch: null },
    })

    const watcher = new EventEmitter()
    plugin.configureServer({
      watcher,
      ws: { on: vi.fn(), send: vi.fn() },
      config: { root: '/project' },
    })

    watcher.emit('change', 'src/index.ts')
    expect(clearScreen).not.toHaveBeenCalled()
  })
})
