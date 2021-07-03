import { spawn } from 'child_process'
import omit from 'lodash.omit'
import pick from 'lodash.pick'
import npmRunPath from 'npm-run-path'
import os from 'os'
import invariant from 'tiny-invariant'
import { ConfigEnv, Plugin } from 'vite'

import type {
  OverlayErrorAction,
  BuildInCheckers,
  ServeAndBuildChecker,
  UserPluginConfig,
  SharedConfig,
} from './types'

export * from './types'
export * from './codeFrame'
export * from './utils'
export * from './worker'
export * as logger from './logger'

const sharedConfigKeys: (keyof SharedConfig)[] = ['enableBuild', 'overlay']
const buildInCheckerKeys: (keyof BuildInCheckers)[] = ['typescript', 'vueTsc']

function createCheckers(userConfig: UserPluginConfig, env: ConfigEnv): ServeAndBuildChecker[] {
  const { typescript, vueTsc } = userConfig
  const serveAndBuildCheckers: ServeAndBuildChecker[] = []
  const sharedConfig = pick(userConfig, sharedConfigKeys)
  const customCheckers = omit(userConfig, [...sharedConfigKeys, ...buildInCheckerKeys])

  if (typescript) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild } = require('./checkers/tsc')
    serveAndBuildCheckers.push(createServeAndBuild({ typescript, ...sharedConfig }, env))
  }

  if (vueTsc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild } = require('./checkers/vue-tsc')
    serveAndBuildCheckers.push(createServeAndBuild({ vueTsc, ...sharedConfig }, env))
  }

  Object.keys(customCheckers).forEach((key) => {
    const checkerCurryFn = customCheckers[key]
    invariant(
      typeof checkerCurryFn === 'function',
      `Custom checker key should be a function, but got ${typeof checkerCurryFn}`
    )

    serveAndBuildCheckers.push(checkerCurryFn(sharedConfig, env))
  })

  return serveAndBuildCheckers
}

export default function Plugin(userConfig?: UserPluginConfig): Plugin {
  let checkers: ServeAndBuildChecker[] = []
  // const checkers = createCheckers(userConfig || {})
  const enableBuild = userConfig?.enableBuild ?? true
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
          hmr: config.server?.hmr,
          env,
        })
      })
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

      checkers.forEach((checker) => {
        const buildBin = checker.build.buildBin
        const proc = spawn(buildBin[0], buildBin[1], {
          cwd: process.cwd(),
          stdio: 'inherit',
          env: localEnv,
          shell: os.platform() === 'win32',
        })

        proc.on('exit', (code) => {
          if (code !== null && code !== 0) {
            process.exit(code)
          }
        })
      })
    },
    configureServer(server) {
      // for dev mode (2/2)
      // Get the server instance and keep reference in a closure
      checkers.forEach((checker) => {
        const { worker, configureServer: workerConfigureServer } = checker.serve
        workerConfigureServer({ root: server.config.root })
        worker.on('message', (action: OverlayErrorAction) => {
          server.ws.send(action.payload)
        })
      })

      return () => {
        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}
