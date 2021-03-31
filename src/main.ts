import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import { ConfigEnv, Plugin } from 'vite'
import { PluginOptions } from './types'

import { createDiagnosis } from './apiMode'
import { tscProcess } from './cliMode'

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const checker = userOptions?.checker ?? 'tsc'
  const enableBuild = userOptions?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined
  let diagnose: ReturnType<typeof createDiagnosis> | null = null

  return {
    name: 'ts-checker',
    config: (config, { command, mode }) => {
      viteMode = command
      if (mode === 'cli') {
        tscProcess.config(config)
      } else {
        diagnose = createDiagnosis({
          root: userOptions?.root,
          tsconfigPath: userOptions?.tsconfigPath,
        })

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

        if (enableBuild) {
          proc.on('exit', (code) => {
            if (code !== null && code !== 0) {
              process.exit(code)
            }
          })
        }
      }
    },
    configureServer(server) {
      diagnose!.configureServer(server)

      return () => {
        server.middlewares.use((req, res, next) => {
          next()
        })
      }
    },
  }
}
