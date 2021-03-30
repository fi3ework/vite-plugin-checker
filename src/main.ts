import { spawn, exec } from 'child_process'
import npmRunPath from 'npm-run-path'
import { ConfigEnv, Plugin } from 'vite'

import { diagnose } from './apiMode'
import { tscProcess } from './cliMode'

const exitHook = require('async-exit-hook')

interface PluginOptions {
  /**
   * Use `tsc` or `vue-tsc`
   * @default 'tcs'
   */
  checker: 'tsc' | 'vue-tsc'
  /**
   * Throw error in build mode
   * @default false
   */
  ignoreInBuild: boolean
  /**
   * Show TypeScript error overlay
   * @default Same as Vite config - `server.hmr.overlay`
   */
  overlay: boolean
  /**
   * [WIP]
   * 'cli': use `tsc --noEmit` or `vue-tsc --noEmit`
   *  - No overlay support
   *  - Original console output
   *
   * 'api': use TypeScript programmatic API
   *  - Support overlay
   *  - Almost the same console output as original
   *
   * @default if `vueTsc` is true, then force set to 'cli', otherwise default to 'api'
   */
  mode: 'cli' | 'api'
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const mode = userOptions?.mode ?? 'api'
  const checker = userOptions?.checker ?? 'tsc'
  const ignoreOnBuild = userOptions?.ignoreInBuild ?? false
  let viteMode: ConfigEnv['command'] | undefined

  return {
    name: 'ts-checker',
    config: (config, { command, mode }) => {
      viteMode = command
      if (mode === 'cli') {
        tscProcess.config(config)
      } else {
        diagnose.config(config)
      }
    },
    buildStart: (options) => {
      if (viteMode === 'build') {
        const localEnv = npmRunPath.env({
          env: process.env,
          cwd: process.cwd(),
          execPath: process.execPath,
        })

        const proc = spawn(checker, ['--noEmit'], {
          cwd: process.cwd(),
          stdio: 'inherit',
          env: localEnv,
        })

        if (!ignoreOnBuild) {
          proc.on('exit', (code) => {
            if (code !== null && code !== 0) {
              process.exit(code)
            }
          })
        }
      }
    },
    configureServer(server) {
      if (mode === 'cli') {
        tscProcess.configureServer(server)
      } else {
        diagnose.configureServer(server)
      }
      return () => {
        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}
