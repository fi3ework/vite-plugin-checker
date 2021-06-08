import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import os from 'os'
import { ConfigEnv, Plugin } from 'vite'

import { ServeAndBuildChecker, OverlayErrorAction, UserPluginConfig } from './types'

export * from './types'
export * from './codeFrame'
export * from './utils'
export * from './worker'

function createCheckers(userConfig: UserPluginConfig): ServeAndBuildChecker[] {
  const serveAndBuildCheckers: ServeAndBuildChecker[] = []
  const { typescript, vueTsc, vls: vlsCurry, ...sharedConfig } = userConfig

  if (typescript) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild } = require('./presets/tsc')
    serveAndBuildCheckers.push(createServeAndBuild({ typescript, ...sharedConfig }))
  }

  if (vueTsc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild } = require('./presets/vue-tsc')
    serveAndBuildCheckers.push(createServeAndBuild({ vueTsc, ...sharedConfig }))
  }

  if (vlsCurry) {
    serveAndBuildCheckers.push(vlsCurry(sharedConfig))
  }

  return serveAndBuildCheckers
}

export default function Plugin(userConfig?: UserPluginConfig): Plugin {
  const checkers = createCheckers(userConfig || {})
  const enableBuild = userConfig?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined

  return {
    name: 'ts-checker',
    config: (config, env) => {
      // for dev mode (1/2)
      // Initialize checker with config
      viteMode = env.command
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
      // Run a bin command in a separated process
      if (viteMode !== 'build') return

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
        })

        if (enableBuild) {
          proc.on('exit', (code) => {
            if (code !== null && code !== 0) {
              process.exit(code)
            }
          })
        }
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
