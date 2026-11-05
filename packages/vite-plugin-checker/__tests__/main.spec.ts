import { EventEmitter } from 'node:events'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  wrapVirtualPrefix,
} from '../src/client'
import { checker } from '../src/main'
import type { UserPluginConfig } from '../src/types'

const { execMock, buildBinMock, configureServerMock } = vi.hoisted(() => ({
  execMock: vi.fn(),
  buildBinMock: vi.fn(() => ['tsc', ['--noEmit']] as const),
  configureServerMock: vi.fn(),
}))

vi.mock('tinyexec', () => ({ x: execMock }))

vi.mock('../src/checkers/typescript/main', () => ({
  createServeAndBuild: () => ({
    serve: {
      config: vi.fn(),
      configureServer: configureServerMock,
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
    execMock.mockReset()
    execMock.mockResolvedValue({ exitCode: 0 })
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
    expect(execMock).toHaveBeenCalledWith('tsc', ['--noEmit'], {
      nodeOptions: expect.objectContaining({ cwd: '/monorepo/packages/app' }),
    })
  })

  it('prefers the plugin root option over the Vite root', async () => {
    await runBuild(
      { typescript: true, root: '/monorepo' },
      '/monorepo/packages/app',
    )

    expect(buildBinMock).toHaveBeenCalledWith(expect.anything(), {
      root: '/monorepo',
    })
    expect(execMock).toHaveBeenCalledWith('tsc', ['--noEmit'], {
      nodeOptions: expect.objectContaining({ cwd: '/monorepo' }),
    })
  })

  it('falls back to node_modules/.bin from the working directory', async () => {
    await runBuild({ typescript: true }, '/monorepo/packages/app')

    const { env } = execMock.mock.calls[0]![2].nodeOptions
    const key = Object.keys(env).find((k) => /^path$/i.test(k))!
    const entries = env[key].split(path.delimiter)
    expect(entries[0]).toBe(path.join(process.cwd(), 'node_modules', '.bin'))
    expect(entries).toContain(
      path.join(path.parse(process.cwd()).root, 'node_modules', '.bin'),
    )
    expect(env[key].endsWith(process.env[key]!)).toBe(true)
  })
})

describe('serve mode with NODE_ENV=production', () => {
  beforeEach(() => {
    execMock.mockReset()
    execMock.mockResolvedValue({ exitCode: 0 })
    buildBinMock.mockClear()
  })

  async function runServe(userConfig: UserPluginConfig) {
    const plugin = checker(userConfig) as any
    await plugin.config({}, { command: 'serve', mode: 'production' })
    plugin.configResolved({
      root: '/project',
      base: '/',
      command: 'serve',
      isProduction: true,
      logger: {},
      server: {},
      build: { watch: null },
    })
    return plugin
  }

  it('does not run build checkers and still injects the overlay', async () => {
    const plugin = await runServe({ typescript: true })

    plugin.buildStart()
    expect(execMock).not.toHaveBeenCalled()

    const code = plugin.transform.handler('', clientEntry)
    expect(code).toContain(`import("${RUNTIME_CLIENT_ENTRY_PATH}")`)
  })
})

const clientEntry = '/project/node_modules/vite/dist/client/client.mjs'

describe('transform', () => {
  const clientEntries = [
    clientEntry,
    '/project/node_modules/.pnpm/vite@8.0.0/node_modules/vite/dist/client/client.mjs',
    '/project/node_modules/rolldown-vite/dist/client/client.mjs',
    'C:\\project\\node_modules\\vite\\dist\\client\\client.mjs',
  ]

  it('injects the runtime entry into the Vite client in serve mode', async () => {
    const plugin = checker({}) as any
    await plugin.config({}, { command: 'serve', mode: 'development' })

    for (const id of clientEntries) {
      expect(plugin.transform.filter.id.test(id)).toBe(true)
      const code = plugin.transform.handler('client();', id)
      expect(code).toMatch(/^client\(\);\n/)
      expect(code).toContain(`import("${RUNTIME_CLIENT_ENTRY_PATH}")`)
      expect(code).toContain('typeof document !== "undefined"')
    }
  })

  it('ignores other modules', async () => {
    const plugin = checker({}) as any
    await plugin.config({}, { command: 'serve', mode: 'development' })

    for (const id of [
      '/project/src/main.ts',
      '/project/node_modules/vite/dist/client/env.mjs',
      '/project/node_modules/not-vite/dist/client/client.mjs',
    ]) {
      expect(plugin.transform.filter.id.test(id)).toBe(false)
      expect(plugin.transform.handler('', id)).toBeUndefined()
    }
  })

  it('does not inject in build mode', async () => {
    const plugin = checker({}) as any
    await plugin.config({}, { command: 'build', mode: 'production' })

    expect(plugin.transform.handler('', clientEntry)).toBeUndefined()
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

  it('forwards serialisable server.watch options to checkers', async () => {
    configureServerMock.mockClear()
    const plugin = checker({ typescript: true }) as any
    await plugin.config({}, { command: 'serve', mode: 'development' })
    plugin.configResolved({
      root: '/project',
      base: '/',
      command: 'serve',
      isProduction: false,
      logger: {},
      server: { origin: undefined },
      build: { watch: null },
    })

    plugin.configureServer({
      watcher: new EventEmitter(),
      ws: { on: vi.fn(), send: vi.fn() },
      config: {
        root: '/project',
        server: {
          watch: {
            usePolling: true,
            interval: 100,
            binaryInterval: 300,
            ignored: () => true,
          },
        },
      },
    })

    expect(configureServerMock).toHaveBeenCalledWith({
      root: '/project',
      watch: { usePolling: true, interval: 100, binaryInterval: 300 },
    })
  })
})
