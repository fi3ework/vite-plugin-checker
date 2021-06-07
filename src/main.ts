import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import os from 'os'
import { ConfigEnv, Plugin } from 'vite'

import { ServeAndBuild, OverlayErrorAction, PluginOptions } from './types'

export * from './types'
export * from './codeFrame'
export * from './utils'
export * from './worker'

function createServeAndBuild(userOptions: Partial<PluginOptions>): ServeAndBuild[] {
  const checkers: ServeAndBuild[] = []
  const { tsc, vueTsc, vls } = userOptions

  if (tsc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild, buildBin } = require('./presets/tsc')
    checkers.push(createServeAndBuild(userOptions.tsc))
  }

  if (vueTsc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServeAndBuild } = require('./presets/vue-tsc')
    checkers.push(createServeAndBuild(userOptions.vueTsc))
  }

  if (vls) {
    checkers.push(vls)
  }

  return checkers
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const serveAndBuilds = createServeAndBuild(userOptions || {})
  const enableBuild = userOptions?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined

  return {
    name: 'ts-checker',
    config: (config, env) => {
      // for dev mode (1/2)
      // Initialize checker with config
      viteMode = env.command
      if (viteMode !== 'serve') return

      serveAndBuilds.forEach((serveAndBuild) => {
        const workerConfig = serveAndBuild.serve.config
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

      serveAndBuilds.forEach((serveAndBuild) => {
        const buildBin = serveAndBuild.build.buildBin
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
      serveAndBuilds.forEach((serveAndBuild) => {
        const { worker, configureServer: workerConfigureServer } = serveAndBuild.serve
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
