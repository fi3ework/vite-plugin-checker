import path from 'node:path'
import { supportsHyperlinks } from 'clickable-path'
import { x } from 'tinyexec'

import type {
  ConfigEnv,
  Logger,
  Plugin,
  ResolvedConfig,
  ServerWatchOptions,
} from 'vite'
import { Checker } from './Checker.js'
import {
  composeClientInjectionCode,
  composeOverlayEntryCode,
  OVERLAY_ENTRY_PATH,
  OVERLAY_PATH,
  readOverlayCode,
  wrapVirtualPrefix,
} from './client/index.js'
import { colorize, supportsTerminalColors } from './colors.js'
import { DOCK_ID, setupDevTools } from './devtools.js'
import { toDiagnostics } from './diagnostics.js'
import { broadcastSnapshot, createHub, shareHub, snapshotOf } from './hub.js'
import {
  type CheckerApi,
  type CheckerEvent,
  EVENT_HELLO,
  EVENT_SNAPSHOT,
  EVENT_STATUS,
  EVENT_UPDATE,
  PROTOCOL_VERSION,
} from './protocol.js'
import {
  ACTION_TYPES,
  type Action,
  type BuildCheckBinStr,
  type BuildInCheckerNames,
  type LintWatchOptions,
  type PluginConfig,
  type ServeAndBuildChecker,
  type UserPluginConfig,
} from './types.js'
import { createUiMiddleware, uiDir, uiUrlFor } from './uiServer.js'

export type {
  CheckerApi,
  CheckerEvent,
  CheckerRun,
  CheckerState,
  CheckerStatus,
  Diagnostic,
  DiagnosticSeverity,
  Snippet,
} from './protocol.js'
export { DOCK_ID }

const VITE_CLIENT_ENTRY_RE =
  /[\\/](?:rolldown-)?vite[\\/]dist[\\/]client[\\/]client\.mjs(?:\?.*)?$/

const buildInCheckerLoaders: Record<
  BuildInCheckerNames,
  () => Promise<{ createServeAndBuild: any }>
> = {
  typescript: () => import('./checkers/typescript/main.js'),
  vueTsc: () => import('./checkers/vueTsc/main.js'),
  eslint: () => import('./checkers/eslint/main.js'),
  stylelint: () => import('./checkers/stylelint/main.js'),
  biome: () => import('./checkers/biome/main.js'),
  oxlint: () => import('./checkers/oxlint/main.js'),
  svelteCheck: () => import('./checkers/svelteCheck/main.js'),
}

const checkerLabels: Record<BuildInCheckerNames, string> = {
  typescript: 'TypeScript',
  vueTsc: 'vue-tsc',
  eslint: 'ESLint',
  stylelint: 'Stylelint',
  biome: 'Biome',
  oxlint: 'oxlint',
  svelteCheck: 'svelte-check',
}

async function createCheckers(
  userConfig: UserPluginConfig,
  env: ConfigEnv,
): Promise<ServeAndBuildChecker[]> {
  const serveAndBuildCheckers: ServeAndBuildChecker[] = []
  const { enableBuild } = userConfig
  const sharedConfig = { enableBuild }

  for (const name of Object.keys(
    buildInCheckerLoaders,
  ) as BuildInCheckerNames[]) {
    if (!userConfig[name]) continue
    const { createServeAndBuild } = await buildInCheckerLoaders[name]()
    serveAndBuildCheckers.push({
      ...createServeAndBuild(
        { [name]: userConfig[name], ...sharedConfig },
        env,
      ),
      name,
    })
  }

  return serveAndBuildCheckers
}

export function checker(userConfig: UserPluginConfig): Plugin<CheckerApi> {
  const enableBuild = userConfig?.enableBuild ?? true
  const enableTerminal = userConfig?.terminal !== false
  const {
    editorUrl,
    badge = 'auto',
    position,
    initialIsOpen = true,
    devtools = true,
  } = typeof userConfig?.overlay === 'object' ? userConfig.overlay : {}
  const enableOverlay = userConfig?.overlay !== false && badge !== false
  const enableDevTools = userConfig?.overlay !== false && devtools
  let initialized = false
  let initializeCounter = 0
  let checkers: ServeAndBuildChecker[] = []
  let checkersPromise: Promise<ServeAndBuildChecker[]> | null = null
  let serverCount = 0
  let workersConfigured = false
  const serverCleanups = new WeakMap<ResolvedConfig, () => void>()
  const self = {}
  let hub = createHub(uiUrlFor('/'))
  let joined = false
  let ownIds: string[] = []
  const subscriptions = new Set<{
    listener: (event: CheckerEvent) => void
    unsubscribe: () => void
  }>()
  let viteMode: ConfigEnv['command'] | undefined
  let buildWatch = false
  let logger: Logger | null = null
  let checkerPromise: Promise<void> | null = null
  let resolvedRoot = process.cwd()

  const api: CheckerApi = {
    protocol: PROTOCOL_VERSION,
    getState: () => hub.store.getState(),
    subscribe(listener) {
      const subscription = {
        listener,
        unsubscribe: hub.store.subscribe(listener),
      }
      subscriptions.add(subscription)
      return () => {
        subscription.unsubscribe()
        subscriptions.delete(subscription)
      }
    },
    claimIndicator(owner) {
      const claim = Symbol(owner)
      hub.claims.add(claim)
      if (hub.claims.size === 1) broadcastSnapshot(hub)
      return () => {
        if (hub.claims.delete(claim) && hub.claims.size === 0) {
          broadcastSnapshot(hub)
        }
      }
    },
    getUiUrl: () => hub.uiUrl,
  }

  const joinHub = (config: ResolvedConfig) => {
    if (joined) return
    joined = true
    const shared = shareHub(config, hub)
    if (shared === hub) return
    for (const claim of hub.claims) shared.claims.add(claim)
    for (const subscription of subscriptions) {
      subscription.unsubscribe()
      subscription.unsubscribe = shared.store.subscribe(subscription.listener)
    }
    hub = shared
  }

  const startWorkers = (root: string, watch: LintWatchOptions | undefined) => {
    const context = { root, editorUrl }
    const { store } = hub

    for (const checker of checkers) {
      const name = checker.name!
      const { worker } = checker.serve
      let id: string = name
      let label = checkerLabels[name]
      for (let n = 2; store.has(id); n++) {
        id = `${name}-${n}`
        label = `${checkerLabels[name]} (${n})`
      }
      ownIds.push(id)
      store.register(id, label)

      worker.on('message', (action: Action) => {
        switch (action.type) {
          case ACTION_TYPES.diagnostics: {
            store.setDiagnostics(id, toDiagnostics(id, action.payload, context))
            break
          }
          case ACTION_TYPES.status:
            store.setStatus(id, action.payload.status, action.payload.error)
            break
          case ACTION_TYPES.console:
            if (Checker.logger.length) {
              // for test injection and customize logger in the future
              Checker.log(action)
            } else {
              logger![action.level](action.payload)
            }
            break
        }
      })

      worker.on('error', (error: Error) => {
        store.setStatus(id, 'failed', error.message)
        logger?.error(colorize('red', `[${label}] ${error.stack ?? error}`))
      })

      checker.serve.configureServer({ root, watch })
      store.setStatus(id, 'checking')
    }
  }

  return {
    name: 'vite-plugin-checker',
    enforce: 'pre',
    api,
    devtools: {
      setup(ctx) {
        if (ctx.mode !== 'dev' || !enableDevTools || hub.devtools) return
        const owner = hub
        owner.devtools = true
        const dispose = setupDevTools(ctx, api, () => hub.claims.size > 0)
        ctx.viteServer?.httpServer?.once('close', () => {
          owner.devtools = false
          dispose()
        })
      },
    },
    // @ts-expect-error
    __internal__checker: Checker,
    config: async (_config, env) => {
      // for dev mode (1/2)
      // Initialize checker with config
      viteMode = env.command

      if (viteMode !== 'serve') {
        // avoid running twice when building client and server (SSR)
        if (initializeCounter === 0) {
          initializeCounter++
        } else {
          initialized = true
          return
        }

        checkers = await createCheckers(userConfig || {}, env)
        return
      }

      if (!checkersPromise) {
        checkersPromise = createCheckers(userConfig || {}, env).then(
          (created) => {
            checkers = created
            for (const checker of checkers) {
              checker.serve.config({
                enableTerminal,
                terminalColors: supportsTerminalColors(),
                terminalHyperlinks:
                  supportsHyperlinks(process.stdout) &&
                  supportsHyperlinks(process.stderr),
                env,
              })
            }
            return checkers
          },
        )
      }

      await checkersPromise
    },
    configResolved(config) {
      logger = config.logger
      joinHub(config)
      hub.uiUrl = uiUrlFor(config.base)
      if (viteMode === 'serve' && enableOverlay) hub.overlayOwner ??= self
      buildWatch = !!config.build.watch
      resolvedRoot = config.root
    },
    async buildEnd() {
      if (viteMode !== 'serve') {
        await checkerPromise
      }
    },
    async closeBundle() {
      if (viteMode !== 'serve') return

      // Vite 5 has no `this.environment`
      const environment = this.environment
      const config =
        environment?.getTopLevelConfig() ?? (this as any)._container?.config

      const cleanup = serverCleanups.get(config)
      if (!cleanup) return
      serverCleanups.delete(config)
      cleanup()

      serverCount--

      if (serverCount === 0) {
        const terminated = checkers
        checkers = []
        hub.store.remove(ownIds)
        ownIds = []
        checkersPromise = null
        workersConfigured = false
        await Promise.all(
          terminated.map((checker) => checker.serve.worker.terminate()),
        )
      }
    },
    resolveId: {
      filter: {
        id: new RegExp(`^(?:${OVERLAY_PATH}|${OVERLAY_ENTRY_PATH})$`),
      },
      handler(id) {
        if (id === OVERLAY_PATH || id === OVERLAY_ENTRY_PATH) {
          return wrapVirtualPrefix(id)
        }

        return
      },
    },
    load: {
      filter: {
        id: new RegExp(
          `^(?:${wrapVirtualPrefix(OVERLAY_PATH)}|${wrapVirtualPrefix(OVERLAY_ENTRY_PATH)})$`,
        ),
      },
      handler(id) {
        if (id === wrapVirtualPrefix(OVERLAY_PATH)) {
          return readOverlayCode()
        }

        if (id === wrapVirtualPrefix(OVERLAY_ENTRY_PATH)) {
          if (hub.overlayOwner && hub.overlayOwner !== self) return
          return composeOverlayEntryCode({
            uiUrl: hub.uiUrl,
            badge,
            initialIsOpen,
            position: position ?? (hub.devtools ? 'br' : 'bl'),
          })
        }

        return
      },
    },
    transform: {
      filter: { id: VITE_CLIENT_ENTRY_RE },
      handler(code, id) {
        if (viteMode !== 'serve' || !enableOverlay) return
        if (hub.overlayOwner && hub.overlayOwner !== self) return
        if (!VITE_CLIENT_ENTRY_RE.test(id)) return

        return `${code}\n${composeClientInjectionCode()}`
      },
    },
    buildStart: () => {
      if (initialized) return
      // only run in build mode
      // run a bin command in a separated process
      if (viteMode !== 'build' || !enableBuild) return

      const root = userConfig.root || resolvedRoot
      const localEnv = withCwdBinPath(process.env)

      const spawnedCheckers = checkers.map((checker) =>
        spawnChecker(checker, userConfig, localEnv, root),
      )

      // wait for checker states while avoiding blocking the build from continuing in parallel
      checkerPromise = Promise.all(spawnedCheckers).then((exitCodes) => {
        const exitCode = exitCodes.find((code) => code !== 0) ?? 0
        // do not exit the process if run `vite build --watch`
        if (exitCode !== 0 && !buildWatch) {
          process.exit(exitCode)
        }
      })
    },
    configureServer(server) {
      serverCount++

      if (!workersConfigured) {
        workersConfigured = true
        startWorkers(
          userConfig.root || server.config.root,
          toLintWatchOptions(server.config.server?.watch),
        )
      }

      if (hub.servers.has(server)) {
        serverCleanups.set(server.config, () => {})
        return
      }
      hub.servers.add(server)

      const owner = hub
      const unsubscribe = owner.store.subscribe((event) => {
        if (event.type === 'update') {
          const { type: _, ...payload } = event
          server.ws.send(EVENT_UPDATE, payload)
        } else {
          const { type: _, ...payload } = event
          server.ws.send(EVENT_STATUS, payload)
        }
      })
      const sendSnapshot = () =>
        server.ws.send(EVENT_SNAPSHOT, snapshotOf(owner))
      owner.broadcasters.add(sendSnapshot)
      serverCleanups.set(server.config, () => {
        unsubscribe()
        owner.broadcasters.delete(sendSnapshot)
        owner.servers.delete(server)
      })

      server.middlewares.use(
        createUiMiddleware({ base: server.config.base, dir: uiDir }),
      )

      server.ws.on(EVENT_HELLO, (_data, client) => {
        client.send(EVENT_SNAPSHOT, snapshotOf(owner))
      })
    },
  }
}

async function spawnChecker(
  checker: ServeAndBuildChecker,
  userConfig: Partial<PluginConfig>,
  localEnv: NodeJS.ProcessEnv,
  cwd: string,
): Promise<number> {
  const buildBin = checker.build.buildBin
  const finalBin: BuildCheckBinStr =
    typeof buildBin === 'function'
      ? buildBin(userConfig, { root: cwd })
      : buildBin

  const [command, args] = finalBin

  try {
    // No shell, so an argument containing a space stays one argument.
    const { exitCode } = await x(command, args, {
      nodeOptions: { cwd, stdio: 'inherit', env: localEnv },
    })
    return exitCode ?? 0
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT'
    console.error(
      colorize('red', notFound ? `${command}: not found` : String(error)),
    )
    return notFound ? 127 : 1
  }
}

// `tinyexec` already prepends the `node_modules/.bin` dirs of the spawn `cwd`.
function withCwdBinPath(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const key = Object.keys(env).find((k) => /^path$/i.test(k)) ?? 'PATH'
  const bins: string[] = []
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    bins.push(path.join(dir, 'node_modules', '.bin'))
    if (path.dirname(dir) === dir) break
  }
  if (env[key]) bins.push(env[key])
  return { ...env, [key]: bins.join(path.delimiter) }
}

export default checker

function toLintWatchOptions(
  watch: ServerWatchOptions | null | undefined,
): LintWatchOptions | undefined {
  if (!watch || typeof watch !== 'object') return undefined

  const options: LintWatchOptions = {}
  if (watch.usePolling !== undefined) options.usePolling = watch.usePolling
  if (watch.interval !== undefined) options.interval = watch.interval
  if (watch.binaryInterval !== undefined) {
    options.binaryInterval = watch.binaryInterval
  }
  return options
}
