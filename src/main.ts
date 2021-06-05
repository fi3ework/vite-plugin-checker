import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import { ConfigEnv, Plugin } from 'vite'

import { Checker, CreateDiagnostic, PluginOptions } from './types'

export * from './types'
export * from './codeFrame'
export * from './utils'

function makeChecker(
  checker: PluginOptions['checker'],
  userOptions?: Partial<PluginOptions>
): Checker {
  if (checker === 'tsc') {
    // TODO: better use import.meta.require
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tscCheckerFactory = require('./presets/tsc').tsCheckerFactory
    return tscCheckerFactory(userOptions)
  } else if (checker === 'vue-tsc') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vueTscCheckerFactory = require('./presets/tsc').tsCheckerFactory
    return vueTscCheckerFactory(userOptions)
  } else {
    return checker
  }
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const checker = makeChecker(userOptions?.checker || 'tsc', userOptions)
  const enableBuild = userOptions?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined
  let diagnostic: ReturnType<CreateDiagnostic> | null = null

  return {
    name: 'ts-checker',
    config: (config, env) => {
      viteMode = env.command
      if (viteMode !== 'serve') return

      diagnostic = checker.createDiagnostic({
        root: userOptions?.root,
        tsconfigPath: userOptions?.tsconfigPath,
      })

      diagnostic.config(config, env)
    },
    buildStart: () => {
      if (viteMode !== 'build') return

      const localEnv = npmRunPath.env({
        env: process.env,
        cwd: process.cwd(),
        execPath: process.execPath,
      })

      const proc = spawn(checker.buildBin[0], checker.buildBin[1], {
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
      diagnostic!.configureServer(server)
      return () => {
        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}
