import { spawn } from 'child_process'
import npmRunPath from 'npm-run-path'
import os from 'os'
import { ConfigEnv, Plugin } from 'vite'

import { createDiagnostic } from './apiMode'
import { tscProcess } from './cliMode'
import { Checker, PluginOptions } from './types'

function isCustomChecker(checker: PluginOptions['checker']): checker is Checker {
  return typeof checker !== 'string'
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
  const checker = userOptions?.checker ?? 'tsc'
  const enableBuild = userOptions?.enableBuild ?? true
  let viteMode: ConfigEnv['command'] | undefined
  let diagnostic: ReturnType<typeof createDiagnostic> | null = null

  return {
    name: 'ts-checker',
    config: (config, { command }) => {
      viteMode = command
      if (mode === 'cli') {
        tscProcess.config(config)
      } else {
        diagnostic = createDiagnostic({
          root: userOptions?.root,
          tsconfigPath: userOptions?.tsconfigPath,
        })

        diagnostic.config(config)
      }
    },
    buildStart: (options) => {
      if (viteMode !== 'build') return

      const defaultTsCheckArgs = ['--noEmit']
      const finalChecker = isCustomChecker(checker) ? checker.buildBin[0] : checker
      const finalCheckerArgs = isCustomChecker(checker) ? checker.buildBin[1] : defaultTsCheckArgs

      const localEnv = npmRunPath.env({
        env: process.env,
        cwd: process.cwd(),
        execPath: process.execPath,
      })

      const proc = spawn(finalChecker, finalCheckerArgs, {
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

export type { CheckerFactory, Checker } from './types'
