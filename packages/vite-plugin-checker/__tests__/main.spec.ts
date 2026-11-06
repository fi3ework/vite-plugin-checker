import { EventEmitter } from 'node:events'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  wrapVirtualPrefix,
} from '../src/client'
import { checker } from '../src/main'
import {
  EVENT_HELLO,
  EVENT_SNAPSHOT,
  EVENT_STATUS,
  EVENT_UPDATE,
} from '../src/protocol'
import {
  ACTION_TYPES,
  DiagnosticLevel,
  type DiagnosticRecord,
  type UserPluginConfig,
} from '../src/types'

const { execMock, buildBinMock, configureServerMock, workers } = vi.hoisted(
  () => ({
    execMock: vi.fn(),
    buildBinMock: vi.fn(() => ['tsc', ['--noEmit']] as const),
    configureServerMock: vi.fn(),
    workers: [] as import('node:events').EventEmitter[],
  }),
)

vi.mock('tinyexec', () => ({ x: execMock }))

vi.mock('../src/checkers/typescript/main', async () => {
  const { EventEmitter } = await import('node:events')
  return {
    createServeAndBuild: () => {
      const worker = Object.assign(new EventEmitter(), {
        terminate: vi.fn(async () => {}),
      })
      workers.push(worker)
      return {
        serve: {
          config: vi.fn(),
          configureServer: configureServerMock,
          worker,
        },
        build: { buildBin: buildBinMock },
      }
    },
  }
})

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
      expect(code).toContain('!globalThis.__VITE_PLUGIN_CHECKER_PAGE__')
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

  it('does not inject when the overlay is disabled', async () => {
    const plugin = checker({ overlay: false }) as any
    await plugin.config({}, { command: 'serve', mode: 'development' })

    expect(plugin.transform.handler('', clientEntry)).toBeUndefined()
  })

  it('does not inject in build mode', async () => {
    const plugin = checker({}) as any
    await plugin.config({}, { command: 'build', mode: 'production' })

    expect(plugin.transform.handler('', clientEntry)).toBeUndefined()
  })
})

describe('dev server state', () => {
  const root = path.resolve('/project')
  const file = path.join(root, 'src', 'main.ts')
  const record: DiagnosticRecord = {
    message: `Type 'number' is not assignable to type 'string'.`,
    stack: '',
    id: file,
    checkerId: 'TypeScript',
    level: DiagnosticLevel.Error,
    loc: { file, line: 1, column: 7 },
    code: 'TS2322',
  }

  async function serve(userConfig: UserPluginConfig = { typescript: true }) {
    const plugin = checker(userConfig) as any
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
    await plugin.config({}, { command: 'serve', mode: 'development' })
    plugin.configResolved({
      root,
      base: '/app/',
      command: 'serve',
      isProduction: false,
      logger,
      server: { origin: undefined },
      build: { watch: null },
    })

    const handlers = new Map<string, (...args: any[]) => void>()
    const ws = {
      on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        handlers.set(event, handler)
      }),
      send: vi.fn(),
    }
    const middlewares = { use: vi.fn() }
    plugin.configureServer({
      watcher: new EventEmitter(),
      ws,
      middlewares,
      config: { root, base: '/app/' },
    })

    return {
      api: plugin.api as import('../src/protocol').CheckerApi,
      ws,
      middlewares,
      handlers,
      logger,
      worker: workers.at(-1)!,
    }
  }

  const sent = (ws: { send: ReturnType<typeof vi.fn> }, event: string) =>
    ws.send.mock.calls
      .filter(([name]) => name === event)
      .map(([, data]) => data)

  it('exposes the api before a dev server exists', () => {
    const { api } = checker({ typescript: true })

    expect(api!.protocol).toBe(1)
    expect(api!.getState()).toEqual([])
    expect(api!.uiUrl).toBe('/__checker/')
  })

  it('publishes worker diagnostics through the api and the HMR channel', async () => {
    const { api, ws, worker } = await serve()
    const events: unknown[] = []
    api.subscribe((event) => events.push(event))

    expect(api.getState()[0]).toMatchObject({
      id: 'typescript',
      label: 'TypeScript',
      status: 'checking',
    })

    worker.emit('message', {
      type: ACTION_TYPES.diagnostics,
      payload: [record],
    })

    const [state] = api.getState()
    expect(state).toMatchObject({ status: 'idle' })
    expect(state!.diagnostics).toEqual([
      expect.objectContaining({
        checkerId: 'typescript',
        code: 'TS2322',
        displayFile: 'src/main.ts',
        line: 1,
        column: 7,
      }),
    ])
    expect(events.map((e: any) => e.type)).toEqual(['update', 'status'])
    expect(sent(ws, EVENT_UPDATE)).toEqual([
      { checkerId: 'typescript', files: { [file]: state!.diagnostics } },
    ])
    expect(sent(ws, EVENT_STATUS).at(-1)).toMatchObject({
      checkerId: 'typescript',
      status: 'idle',
    })
    expect(sent(ws, 'vite-plugin-checker')).toEqual([
      expect.objectContaining({ event: 'vite-plugin-checker:error' }),
    ])
  })

  it('answers a client hello with a snapshot', async () => {
    const { handlers, worker } = await serve()
    worker.emit('message', {
      type: ACTION_TYPES.diagnostics,
      payload: [record],
    })

    const client = { send: vi.fn() }
    handlers.get(EVENT_HELLO)!({ protocol: 1 }, client)

    expect(client.send).toHaveBeenCalledWith(EVENT_SNAPSHOT, {
      protocol: 1,
      checkers: [expect.objectContaining({ id: 'typescript' })],
      indicatorClaimed: false,
    })
  })

  it('broadcasts indicator claims only when the claimed state flips', async () => {
    const { api, ws } = await serve()

    const releaseA = api.claimIndicator('my-bad')
    const releaseB = api.claimIndicator('nuxt')
    releaseA()
    releaseA()
    expect(sent(ws, EVENT_SNAPSHOT)).toEqual([
      expect.objectContaining({ indicatorClaimed: true }),
    ])

    releaseB()
    expect(sent(ws, EVENT_SNAPSHOT).at(-1)).toMatchObject({
      indicatorClaimed: false,
    })
  })

  it('marks a checker failed when its worker reports or crashes', async () => {
    const { api, logger, worker } = await serve()

    worker.emit('message', {
      type: ACTION_TYPES.status,
      payload: { status: 'failed', error: 'tsconfig.json not found' },
    })
    expect(api.getState()[0]).toMatchObject({
      status: 'failed',
      error: 'tsconfig.json not found',
    })

    worker.emit('error', new Error('worker crashed'))
    expect(api.getState()[0]).toMatchObject({ error: 'worker crashed' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('worker crashed'),
    )
  })

  it('includes the Vite base in the UI URL', async () => {
    const { api } = await serve()
    expect(api.uiUrl).toBe('/app/__checker/')
  })

  it('serves the diagnostics page from the dev server', async () => {
    const { middlewares } = await serve()
    expect(middlewares.use).toHaveBeenCalledOnce()
  })

  it('keeps the api working when the overlay is disabled', async () => {
    const { api, ws, worker } = await serve({
      typescript: true,
      overlay: false,
    })
    worker.emit('message', {
      type: ACTION_TYPES.diagnostics,
      payload: [record],
    })

    expect(api.getState()[0]!.diagnostics).toHaveLength(1)
    expect(sent(ws, 'vite-plugin-checker')).toEqual([])
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
      middlewares: { use: vi.fn() },
      config: { root: '/project', base: '/' },
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
      middlewares: { use: vi.fn() },
      config: {
        root: '/project',
        base: '/',
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
