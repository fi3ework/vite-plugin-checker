import { spawn } from 'child_process'
import pick from 'lodash.pick'
import npmRunPath from 'npm-run-path'
import { ConfigEnv, Plugin } from 'vite'

import { Checker } from './Checker'
import {
  RUNTIME_PUBLIC_PATH,
  runtimeCode,
  WS_CHECKER_RECONNECT_EVENT,
  WS_CHECKER_CONFIG_RUNTIME_EVENT,
} from './client/index'
import {
  ACTION_TYPES,
  BuildCheckBinStr,
  BuildInCheckerNames,
  OverlayErrorAction,
  PluginConfig,
  ServeAndBuildChecker,
  SharedConfig,
  UserPluginConfig,
} from './types'

export * from './types'
export * from './codeFrame'
export * from './worker'
export { Checker } from './Checker'

const sharedConfigKeys: (keyof SharedConfig)[] = ['enableBuild', 'overlay']
const buildInCheckerKeys: BuildInCheckerNames[] = ['typescript', 'vueTsc', 'vls', 'eslint']

function createCheckers(userConfig: UserPluginConfig, env: ConfigEnv): ServeAndBuildChecker[] {
  const serveAndBuildCheckers: ServeAndBuildChecker[] = []
  const sharedConfig = pick(userConfig, sharedConfigKeys)

  buildInCheckerKeys.forEach((name: BuildInCheckerNames) => {
    if (!userConfig[name]) return

    const { createServeAndBuild } = require(`./checkers/${name}/main`)
    serveAndBuildCheckers.push(
      createServeAndBuild({ [name]: userConfig[name], ...sharedConfig }, env)
    )
  })

  return serveAndBuildCheckers
}

export default function Plugin(userConfig: UserPluginConfig): Plugin {
  const enableBuild = userConfig?.enableBuild ?? true
  const enableOverlay = userConfig?.overlay !== false
  const enableTerminal = userConfig?.terminal !== false
  const overlayConfig = typeof userConfig?.overlay === 'object' ? userConfig?.overlay : null
  let checkers: ServeAndBuildChecker[] = []
  let viteMode: ConfigEnv['command'] | undefined

  return {
    name: 'vite-plugin-checker',
    config: (config, env) => {
      // for dev mode (1/2)
      // Initialize checker with config
      viteMode = env.command
      checkers = createCheckers(userConfig || {}, env)
      if (viteMode !== 'serve') return

      checkers.forEach((checker) => {
        const workerConfig = checker.serve.config
        workerConfig({
          enableOverlay,
          enableTerminal,
          env,
        })
      })
    },
    buildEnd() {
      if (viteMode === 'serve') {
        checkers.forEach((checker) => {
          const { worker } = checker.serve
          worker.terminate()
        })
      }
    },
    resolveId(id) {
      if (id === RUNTIME_PUBLIC_PATH) {
        return id
      }
    },
    load(id) {
      if (id === RUNTIME_PUBLIC_PATH) {
        return runtimeCode
      }
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `import { inject } from "${RUNTIME_PUBLIC_PATH}"; inject();`,
        },
      ]
    },
    buildStart: () => {
      // for build mode
      // run a bin command in a separated process
      if (viteMode !== 'build') return

      // do not do anything when disable build mode
      if (!enableBuild) return

      const localEnv = npmRunPath.env({
        env: process.env,
        cwd: process.cwd(),
        execPath: process.execPath,
      })

      // spawn an async runner that we don't wait for in order to avoid blocking the build from continuing in parallel
      ;(async () => {
        const exitCodes = await Promise.all(
          checkers.map((checker) => spawnChecker(checker, userConfig, localEnv))
        )
        const exitCode = exitCodes.find((code) => code !== 0) ?? 0
        if (exitCode !== 0) process.exit(exitCode)
      })()
    },
    configureServer(server) {
      let connectedTimes = 0
      let latestOverlayErrors: OverlayErrorAction['payload'][] = new Array(checkers.length)
      // for dev mode (2/2)
      // Get the server instance and keep reference in a closure
      if (overlayConfig) {
        server.ws.send({
          type: 'custom',
          event: WS_CHECKER_CONFIG_RUNTIME_EVENT,
          data: overlayConfig,
        })
      }
      checkers.forEach((checker, index) => {
        const { worker, configureServer: workerConfigureServer } = checker.serve
        workerConfigureServer({ root: server.config.root })
        worker.on('message', (action: OverlayErrorAction) => {
          if (action.type === ACTION_TYPES.overlayError) {
            latestOverlayErrors[index] = action.payload
            if (action.payload) {
              server.ws.send(action.payload)
            }
          } else if (action.type === ACTION_TYPES.console) {
            Checker.log(action)
          }
        })
      })

      return () => {
        // sometimes Vite will trigger a full-reload instead of HMR, but the checker
        // may update the overlay before full-reload fired. So we make sure the overlay
        // will be displayed again after full-reload.
        server.ws.on('connection', () => {
          connectedTimes++
          // if connectedCount !== 1, means Vite is doing a full-reload, so we don't need to send overlay again
          if (connectedTimes > 1) {
            if (overlayConfig) {
              server.ws.send({
                type: 'custom',
                event: WS_CHECKER_CONFIG_RUNTIME_EVENT,
                data: overlayConfig,
              })
            }
            server.ws.send({
              type: 'custom',
              event: WS_CHECKER_RECONNECT_EVENT,
              data: latestOverlayErrors.filter(Boolean),
            })
          }
        })

        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}

function spawnChecker(
  checker: ServeAndBuildChecker,
  userConfig: Partial<PluginConfig>,
  localEnv: npmRunPath.ProcessEnv
) {
  return new Promise<number>((resolve) => {
    const buildBin = checker.build.buildBin
    const finalBin: BuildCheckBinStr =
      typeof buildBin === 'function' ? buildBin(userConfig) : buildBin

    const proc = spawn(...finalBin, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: localEnv,
      // shell is necessary on windows to get the process to even start.
      // Command line args constructed by checkers therefore need to escape double quotes
      // to have them not striped out by cmd.exe. Using shell on all platforms lets us avoid
      // having to perform platform-specific logic around escaping quotes since all platform
      // shells will strip out unescaped double quotes. E.g. shell=false on linux only would
      // result in escaped quotes not being unescaped.
      shell: true,
    })

    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        resolve(code)
      } else {
        resolve(0)
      }
    })
  })
}
