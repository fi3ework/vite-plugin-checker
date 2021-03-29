import { Plugin } from 'vite'

import { diagnose } from './apiMode'
import { tscProcess } from './cliMode'

interface PluginOptions {
  /**
   * [WIP] Use `tsc` or `vue-tsc`
   * @default if vue-tsc is installed, then true, otherwise false
   */
  vueTsc: boolean
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
  /**
   * Run in build mode ()
   * @default true
   */
  build: boolean | {}
}

export default function Plugin(userOptions?: Partial<PluginOptions>): Plugin {
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
