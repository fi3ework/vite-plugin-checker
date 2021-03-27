// import ts from 'typescript'
import { exec, ChildProcess, spawn } from 'child_process'
import { ViteDevServer, Plugin } from 'vite'
import logUpdate from 'log-update'

interface PluginOptions {
  /**
   * Whether to use vue-tsc to check .vue file.
   * @default !!import('vue-tsc')
   */
  vueTsc?: boolean
  /**
   *
   */
  displayMode?: 'spawn' | 'exec'
  /**
   *
   */
  errorOverlay?: boolean
}

const placeHolders = {
  tscStart: '',
  tscEnd: ' error.',
  tscWatchStart: 'File change detected. Starting incremental compilation...',
  tscWatchEnd: '. Watching for file changes.',
}

function setOutputState(data: string): 'start' | 'middle' | 'end' {
  if (data.includes(placeHolders.tscWatchStart)) {
    return 'start'
  }

  if (data.includes(placeHolders.tscWatchEnd)) {
    return 'end'
  }

  return 'middle'
}

export function plugin(userOptions?: PluginOptions): Plugin {
  let hasVueTsc = false
  let err: string | null = null
  try {
    require.resolve('vue-tsc')
    hasVueTsc = true
  } catch {}

  const options: PluginOptions = {
    vueTsc: userOptions?.vueTsc ?? hasVueTsc,
  }

  return {
    name: 'fork-ts-checker',
    configureServer(server) {
      const root = server.config.root
      // let diagnosticCount = 0
      // let outputing = false

      const tsProc = spawn('tsc', ['--noEmit', '--watch'], { cwd: root, stdio: 'pipe' })
      // const tsProc = exec('tsc --noEmit --watch', { cwd: root })
      // diagnosticCount++

      tsProc.stdout.on('data', (data) => {
        const dataStr = data.toString()
        if (dataStr.includes('Found 1 error')) {
          err = dataStr
          server.ws.send({
            type: 'error',
            err: {
              message: 'dataStr',
              stack: '',
              // id: 'sdf',
              // frame: strip((err as RollupError).frame || ''),
              // plugin: (err as RollupError).plugin,
              // pluginCode: (err as RollupError).pluginCode,
              // loc: (err as RollupError).loc,
            },
          })
        }

        if (dataStr.includes('Found 0 error')) {
          err = null
          server.ws.send({
            type: 'update',
            updates: [],
          })
        }
        // do not clear stdout
        // if (dataStr === '\x1Bc') return
        // console.log(data)
        // process.stdout.pipe(data)
      })

      // const is = require.resolve

      // return a post hook that is called after internal middlewares are
      // installed
      return () => {
        server.middlewares.use((req, res, next) => {
          next(undefined)
        })
      }
    },
  }
}
