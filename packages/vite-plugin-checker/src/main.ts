import { spawn } from 'child_process'
import pick from 'lodash.pick'
import npmRunPath from 'npm-run-path'
import os from 'os'
import { ConfigEnv, Plugin } from 'vite'

import type {
  OverlayErrorAction,
  BuildInCheckerNames,
  ServeAndBuildChecker,
  UserPluginConfig,
  SharedConfig,
  BuildCheckBinStr,
  PluginConfig,
} from './types'

export * from './types'
export * from './codeFrame'
export * from './worker'

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

      Promise.all(checkers.map((checker) => spawnChecker(checker, userConfig, localEnv))).then(
        (exitCodes) => {
          const exitCode = exitCodes.find((code) => code !== 0) || 0
          process.exit(exitCode)
        }
      )
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
      shell: os.platform() === 'win32',
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
