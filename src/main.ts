import { Plugin } from 'vite'

import { diagnose } from './apiMode'
import { tscProcess } from './cliMode'

interface PluginOptions {
  /**
   * Use tsc or vue-tsc
   * @default !!import.resolve('vue-tsc')
   */
  vueTsc: boolean
  /**
   * Show TypeScript error overlay
   * @default Vite config `server.hmr.overlay`, can be override by
   */
  overlay: boolean
  /**
   * WIP
   */
  mode: 'cli' | 'api'
}

export function plugin(userOptions?: Partial<PluginOptions>): Plugin {
  let hasVueTsc = false
  try {
    require.resolve('vue-tsc')
    hasVueTsc = true
  } catch {}

  const mode = userOptions?.mode ?? 'api'

  return {
    name: 'fork-ts-checker',
    config: (config) => {
      if (mode === 'cli') {
        tscProcess.config(config)
      } else {
        diagnose.config(config)
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
