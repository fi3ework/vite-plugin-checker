// import ts from 'typescript'
import { exec, ChildProcess } from 'child_process'
import { ViteDevServer, Plugin } from 'vite'
import logUpdate from 'log-update'

interface PluginOptions {
  /**
   * Whether to use vue-tsc to check .vue file.
   *
   * @default !!import('vue-tsc')
   */
  vueTsc?: boolean
}

export function plugin(userOptions?: PluginOptions): Plugin {
  let hasVueTsc = false
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
      // const is = require.resolve

      // return a post hook that is called after internal middlewares are
      // installed
      return () => {
        const root = server.config.root

        server.middlewares.use((req, res, next) => {
          const tsProc = exec('tsc --noEmit --watch', { cwd: root })
          const vueProc = options.vueTsc && exec('vue-tsc --noEmit --watch', { cwd: root })

          if (!tsProc.stdout) throw Error('failed to output')

          tsProc.stdout.on('data', (data) => {
            const dataStr = data.toString()
            if (dataStr === '\x1Bc') return
            console.log('stdout: ' + dataStr)
          })

          next()
        })
      }
    },
  }
}
