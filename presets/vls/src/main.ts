import { diagnostics, LogLevel, logLevels } from './commands/diagnostics'
import type { UserConfig, ViteDevServer } from 'vite'
import { CheckerFactory } from 'vite-plugin-ts-checker'

const createDiagnostic: CheckerFactory = () => {
  return {
    config: () => {},
    configureServer: () => {},
    buildStart: () => {},
    buildBin: ['vite-plugin-ts-checker-preset-vls', ['diagnostics']],
  }
}

export default createDiagnostic
