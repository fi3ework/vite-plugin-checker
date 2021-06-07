import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import os from 'os'
import { ConfigEnv, Plugin } from 'vite'

import { ServeAndBuild, OverlayErrorAction, PluginOptions } from './types'

export * from './types'
export * from './codeFrame'
export * from './utils'
export * from './worker'

function createServeAndBuild(
  checker: PluginOptions['checker'],
  userOptions?: Partial<PluginOptions>
): ServeAndBuild {
  if (typeof checker === 'string') {
    // build in checkers
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createWorker, buildBin } = require(`./presets/${checker}`)
    return { serve: createWorker(userOptions), build: { buildBin } }
  }

  return checker
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const {
    serve: { worker, config: workerConfig, configureServer: workerConfigureServer },
    build: { buildBin },
  } = createServeAndBuild(userOptions?.checker || 'tsc', userOptions)
  const enableBuild = userOptions?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined
  // let diagnostic: ReturnType<CreateDiagnostic> | null = null

  return {
    name: 'ts-checker',
    config: (config, env) => {
      // for dev mode (1/2)
      // Initialize checker with config
      viteMode = env.command
      if (viteMode !== 'serve') return

      workerConfig({
        hmr: config.server?.hmr,
        env,
      })
      // diagnostic = checker.createDiagnostic({
      //   root: userOptions?.root,
      //   tsconfigPath: userOptions?.tsconfigPath,
      // })

      // diagnostic.config(config, env)
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
    },
    configureServer(server) {
      // for dev mode (2/2)
      // Get the server instance and keep reference in a closure
      workerConfigureServer({ root: server.config.root })
      worker.on('message', (action: OverlayErrorAction) => {
        server.ws.send(action.payload)
      })

      return () => {
        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}
