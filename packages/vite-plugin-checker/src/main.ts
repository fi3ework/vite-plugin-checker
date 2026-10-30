import { npmRunPathEnv, type ProcessEnv } from 'npm-run-path'
import colors from 'picocolors'
import { x } from 'tinyexec'

import type { ConfigEnv, Logger, Plugin, ResolvedConfig } from 'vite'
import { Checker } from './Checker.js'
import {
  composePreambleCode,
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  runtimeCode,
  WS_CHECKER_RECONNECT_EVENT,
  wrapVirtualPrefix,
} from './client/index.js'
import {
  ACTION_TYPES,
  type Action,
  type BuildCheckBinStr,
  type BuildInCheckerNames,
  type ClientDiagnosticPayload,
  type ClientReconnectPayload,
  type PluginConfig,
  type ServeAndBuildChecker,
  type UserPluginConfig,
} from './types.js'

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
}

async function createCheckers(
  userConfig: UserPluginConfig,
  env: ConfigEnv,
): Promise<ServeAndBuildChecker[]> {
  const serveAndBuildCheckers: ServeAndBuildChecker[] = []
  const { enableBuild, overlay } = userConfig
  const sharedConfig = { enableBuild, overlay }

  for (const name of Object.keys(
    buildInCheckerLoaders,
  ) as BuildInCheckerNames[]) {
    if (!userConfig[name]) continue
    const { createServeAndBuild } = await buildInCheckerLoaders[name]()
    serveAndBuildCheckers.push(
      createServeAndBuild({ [name]: userConfig[name], ...sharedConfig }, env),
    )
  }

  return serveAndBuildCheckers
}

export function checker(userConfig: UserPluginConfig): Plugin {
  const enableBuild = userConfig?.enableBuild ?? true
  const enableOverlay = userConfig?.overlay !== false
  const enableTerminal = userConfig?.terminal !== false
  const overlayConfig =
    typeof userConfig?.overlay === 'object' ? userConfig?.overlay : {}
  let initialized = false
  let initializeCounter = 0
  let checkers: ServeAndBuildChecker[] = []
  let latestOverlayErrors: ClientReconnectPayload['data'] = []
  let checkersPromise: Promise<ServeAndBuildChecker[]> | null = null
  let serverCount = 0
  let workersConfigured = false
  const serverListeners = new WeakMap<
    ResolvedConfig,
    ((action: Action) => void)[]
  >()
  let isProduction = false
  let baseWithOrigin: string
  let viteMode: ConfigEnv['command'] | undefined
  let buildWatch = false
  let logger: Logger | null = null
  let checkerPromise: Promise<void> | null = null
  let resolvedRoot = process.cwd()

  return {
    name: 'vite-plugin-checker',
    enforce: 'pre',
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
                enableOverlay,
                enableTerminal,
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
      baseWithOrigin = config.server.origin
        ? config.server.origin + config.base
        : config.base
      isProduction ||= config.isProduction || config.command === 'build'
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

      const listeners = serverListeners.get(config)
      if (!listeners) return
      serverListeners.delete(config)

      serverCount--
      checkers.forEach((checker, index) => {
        checker.serve.worker.off('message', listeners[index]!)
      })

      if (serverCount === 0) {
        const terminated = checkers
        checkers = []
        latestOverlayErrors = []
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
          return composePreambleCode({
            baseWithOrigin,
            overlayConfig,
            useBase: false,
          })
        }

        return
      },
    },
    transformIndexHtml() {
      if (initialized) return
      if (isProduction) return

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: composePreambleCode({ baseWithOrigin, overlayConfig }),
        },
      ]
    },
    buildStart: () => {
      if (initialized) return
      // only run in build mode
      // run a bin command in a separated process
      if (!isProduction || !enableBuild) return

      const root = userConfig.root || resolvedRoot
      const localEnv = npmRunPathEnv({
        env: npmRunPathEnv({ env: process.env, addExecPath: false }),
        cwd: root,
        execPath: process.execPath,
      })

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
      if (latestOverlayErrors.length !== checkers.length) {
        latestOverlayErrors = new Array(checkers.length)
      }
      const listeners: ((action: Action) => void)[] = []
      serverListeners.set(server.config, listeners)

      if (!workersConfigured) {
        workersConfigured = true
        checkers.forEach((checker) => {
          checker.serve.configureServer({
            root: userConfig.root || server.config.root,
          })
        })
      }

      // for dev mode (2/2)
      // Get the server instance and keep reference in a closure
      checkers.forEach((checker, index) => {
        const { worker } = checker.serve
        const listener = (action: Action) => {
          if (action.type === ACTION_TYPES.overlayError) {
            latestOverlayErrors[index] =
              action.payload as ClientDiagnosticPayload
            if (action.payload) {
              server.ws.send('vite-plugin-checker', action.payload)
            }
          } else if (action.type === ACTION_TYPES.console) {
            if (Checker.logger.length) {
              // for test injection and customize logger in the future
              Checker.log(action)
            } else {
              logger![action.level](action.payload)
            }
          }
        }
        listeners.push(listener)
        worker.on('message', listener)
      })

      if (server.ws.on) {
        server.ws.on('vite-plugin-checker', (data) => {
          // NOTE: sync modification with packages /packages/runtime/src/ws.js
          if (data.event === 'runtime-loaded') {
            server.ws.send('vite-plugin-checker', {
              event: WS_CHECKER_RECONNECT_EVENT,
              data: latestOverlayErrors.filter(Boolean),
            })
          }
        })
      } else {
        setTimeout(() => {
          logger!.warn(
            colors.yellow(
              '[vite-plugin-checker]: `server.ws.on` is introduced to Vite in 2.6.8, see [PR](https://github.com/vitejs/vite/pull/5273) and [changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#268-2021-10-18). \nvite-plugin-checker relies on `server.ws.on` to send overlay message to client. Support for Vite < 2.6.8 will be removed in the next major version release.',
            ),
          )
          // make a delay to avoid flush by Vite's console
        }, 5000)
      }
    },
  }
}

async function spawnChecker(
  checker: ServeAndBuildChecker,
  userConfig: Partial<PluginConfig>,
  localEnv: ProcessEnv,
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
      colors.red(notFound ? `${command}: not found` : String(error)),
    )
    return notFound ? 127 : 1
  }
}

export default checker
