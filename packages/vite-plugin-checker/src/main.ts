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
  composePreambleCode,
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  runtimeCode,
  WS_CHECKER_RECONNECT_EVENT,
  wrapVirtualPrefix,
} from './client/index.js'
import { colorize, supportsTerminalColors } from './colors.js'
import { toDiagnostics, toLegacyDiagnostics } from './diagnostics.js'
import { toClientPayload, withOverlayFileLinks } from './logger.js'
import {
  type CheckerApi,
  EVENT_HELLO,
  EVENT_SNAPSHOT,
  EVENT_STATUS,
  EVENT_UPDATE,
  PROTOCOL_VERSION,
  type SnapshotPayload,
} from './protocol.js'
import { createCheckerStore } from './store.js'
import {
  ACTION_TYPES,
  type Action,
  type BuildCheckBinStr,
  type BuildInCheckerNames,
  type ClientDiagnosticPayload,
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

// TODO: remove with the legacy runtime once the new overlay consumes `EVENT_*`
const legacyCheckerIds: Record<BuildInCheckerNames, string> = {
  typescript: 'typescript',
  vueTsc: 'vue-tsc',
  eslint: 'eslint',
  stylelint: 'stylelint',
  biome: 'biome',
  oxlint: 'oxlint',
  svelteCheck: 'svelte-check',
}
const LEGACY_EVENT = 'vite-plugin-checker'

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
  const enableOverlay = userConfig?.overlay !== false
  const enableTerminal = userConfig?.terminal !== false
  const { editorUrl, ...overlayConfig } =
    typeof userConfig?.overlay === 'object' ? userConfig.overlay : {}
  let initialized = false
  let initializeCounter = 0
  let checkers: ServeAndBuildChecker[] = []
  let checkersPromise: Promise<ServeAndBuildChecker[]> | null = null
  let serverCount = 0
  let workersConfigured = false
  const serverCleanups = new WeakMap<ResolvedConfig, () => void>()
  const store = createCheckerStore()
  const indicatorClaims = new Set<symbol>()
  const snapshotBroadcasters = new Set<() => void>()
  const legacyBroadcasters = new Set<
    (payload: ClientDiagnosticPayload) => void
  >()
  let latestOverlayErrors = new Map<number, ClientDiagnosticPayload>()
  let uiUrl = uiUrlFor('/')
  let baseWithOrigin: string
  let viteMode: ConfigEnv['command'] | undefined
  let buildWatch = false
  let logger: Logger | null = null
  let checkerPromise: Promise<void> | null = null
  let resolvedRoot = process.cwd()

  const snapshot = (): SnapshotPayload => ({
    protocol: PROTOCOL_VERSION,
    checkers: store.getState(),
    indicatorClaimed: indicatorClaims.size > 0,
  })

  const broadcastSnapshot = () => {
    for (const broadcast of snapshotBroadcasters) broadcast()
  }

  const api: CheckerApi = {
    protocol: PROTOCOL_VERSION,
    getState: () => store.getState(),
    subscribe: (listener) => store.subscribe(listener),
    claimIndicator(owner) {
      const claim = Symbol(owner)
      indicatorClaims.add(claim)
      if (indicatorClaims.size === 1) broadcastSnapshot()
      return () => {
        if (indicatorClaims.delete(claim) && indicatorClaims.size === 0) {
          broadcastSnapshot()
        }
      }
    },
    get uiUrl() {
      return uiUrl
    },
  }

  const startWorkers = (root: string, watch: LintWatchOptions | undefined) => {
    const context = { root, editorUrl }

    checkers.forEach((checker, index) => {
      const name = checker.name!
      const { worker } = checker.serve
      store.register(name, checkerLabels[name])

      worker.on('message', (action: Action) => {
        switch (action.type) {
          case ACTION_TYPES.diagnostics: {
            store.setDiagnostics(
              name,
              toDiagnostics(name, action.payload, context),
            )
            if (!enableOverlay) break
            const payload = withOverlayFileLinks(
              toClientPayload(
                legacyCheckerIds[name],
                toLegacyDiagnostics(action.payload),
              ),
              root,
              editorUrl,
            )
            latestOverlayErrors.set(index, payload)
            for (const broadcast of legacyBroadcasters) broadcast(payload)
            break
          }
          case ACTION_TYPES.status:
            store.setStatus(name, action.payload.status, action.payload.error)
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
        store.setStatus(name, 'failed', error.message)
        logger?.error(
          colorize('red', `[${checkerLabels[name]}] ${error.stack ?? error}`),
        )
      })

      checker.serve.configureServer({ root, watch })
      store.setStatus(name, 'checking')
    })
  }

  return {
    name: 'vite-plugin-checker',
    enforce: 'pre',
    api,
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
      uiUrl = uiUrlFor(config.base)
      baseWithOrigin = config.server.origin
        ? config.server.origin + config.base
        : config.base
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
        latestOverlayErrors = new Map()
        store.clear()
        checkersPromise = null
        workersConfigured = false
        await Promise.all(
          terminated.map((checker) => checker.serve.worker.terminate()),
        )
      }
    },
    resolveId: {
      filter: {
        id: new RegExp(
          `^(?:${RUNTIME_CLIENT_RUNTIME_PATH}|${RUNTIME_CLIENT_ENTRY_PATH})$`,
        ),
      },
      handler(id) {
        if (
          id === RUNTIME_CLIENT_RUNTIME_PATH ||
          id === RUNTIME_CLIENT_ENTRY_PATH
        ) {
          return wrapVirtualPrefix(id)
        }

        return
      },
    },
    load: {
      filter: {
        id: new RegExp(
          `^(?:${wrapVirtualPrefix(RUNTIME_CLIENT_RUNTIME_PATH)}|${wrapVirtualPrefix(RUNTIME_CLIENT_ENTRY_PATH)})$`,
        ),
      },
      handler(id) {
        if (id === wrapVirtualPrefix(RUNTIME_CLIENT_RUNTIME_PATH)) {
          return runtimeCode
        }

        if (id === wrapVirtualPrefix(RUNTIME_CLIENT_ENTRY_PATH)) {
          return composePreambleCode({ baseWithOrigin, overlayConfig })
        }

        return
      },
    },
    transform: {
      filter: { id: VITE_CLIENT_ENTRY_RE },
      handler(code, id) {
        if (viteMode !== 'serve' || !enableOverlay) return
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

      const unsubscribe = store.subscribe((event) => {
        if (event.type === 'update') {
          const { type: _, ...payload } = event
          server.ws.send(EVENT_UPDATE, payload)
        } else {
          const { type: _, ...payload } = event
          server.ws.send(EVENT_STATUS, payload)
        }
      })
      const broadcastSnapshot = () => server.ws.send(EVENT_SNAPSHOT, snapshot())
      const broadcastLegacy = (payload: ClientDiagnosticPayload) =>
        server.ws.send(LEGACY_EVENT, payload)
      snapshotBroadcasters.add(broadcastSnapshot)
      legacyBroadcasters.add(broadcastLegacy)
      serverCleanups.set(server.config, () => {
        unsubscribe()
        snapshotBroadcasters.delete(broadcastSnapshot)
        legacyBroadcasters.delete(broadcastLegacy)
      })

      server.middlewares.use(
        createUiMiddleware({ base: server.config.base, dir: uiDir }),
      )

      server.ws.on(EVENT_HELLO, (_data, client) => {
        client.send(EVENT_SNAPSHOT, snapshot())
      })

      server.ws.on(LEGACY_EVENT, (data) => {
        if (data.event === 'runtime-loaded') {
          server.ws.send(LEGACY_EVENT, {
            event: WS_CHECKER_RECONNECT_EVENT,
            data: [...latestOverlayErrors]
              .sort(([a], [b]) => a - b)
              .map(([, payload]) => payload),
          })
        }
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
