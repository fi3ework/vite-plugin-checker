import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToConsoleLevel,
  diagnosticToTerminalLog,
  type NormalizedDiagnostic,
  reportDiagnostics,
} from '../../logger.js'
import { type CreateDiagnostic, DiagnosticLevel } from '../../types.js'
import { resolveOptions } from './options.js'
import { setupDevServer } from './server.js'

export interface DisplayOptions {
  terminal: boolean
}

export const createDiagnostic: CreateDiagnostic<'oxlint'> = (pluginConfig) => {
  const manager = new FileDiagnosticManager()

  const oxlintConfig = pluginConfig.oxlint
  const display: DisplayOptions = { terminal: true }

  return {
    config: async ({ enableTerminal }) => {
      display.terminal = enableTerminal
    },
    async configureServer({ root, watch }) {
      if (!oxlintConfig) return

      const options = resolveOptions(root, oxlintConfig)
      await setupDevServer(root, options, manager, display, watch)
    },
  }
}

export function dispatchDiagnostics(
  diagnostics: NormalizedDiagnostic[],
  display: DisplayOptions,
) {
  if (display.terminal) {
    dispatchTerminalDiagnostics(diagnostics)
  }
  reportDiagnostics(diagnostics)
}

function dispatchTerminalDiagnostics(diagnostics: NormalizedDiagnostic[]) {
  for (const d of diagnostics) {
    consoleLog(
      diagnosticToTerminalLog(d, 'oxlint'),
      diagnosticToConsoleLevel(d),
    )
  }

  const errorCount = diagnostics.filter(
    (d) => d.level === DiagnosticLevel.Error,
  ).length
  const warningCount = diagnostics.filter(
    (d) => d.level === DiagnosticLevel.Warning,
  ).length
  consoleLog(
    composeCheckerSummary('oxlint', errorCount, warningCount),
    errorCount ? 'error' : warningCount ? 'warn' : 'info',
  )
}
