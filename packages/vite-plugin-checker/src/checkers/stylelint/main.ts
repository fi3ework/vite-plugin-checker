import path from 'node:path'
import { fileURLToPath } from 'node:url'
import stylelint from 'stylelint'
import { Checker } from '../../Checker.js'
import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { createIgnore } from '../../glob.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToConsoleLevel,
  diagnosticToTerminalLog,
  filterLogLevel,
  normalizeStylelintDiagnostic,
  reportDiagnostics,
  reportStatus,
} from '../../logger.js'
import { DiagnosticLevel } from '../../types.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import {
  createLintScheduler,
  DEFAULT_DEBOUNCE_MS,
} from '../_shared/lintScheduler.js'
import { watchLintTargets } from '../_shared/lintWatcher.js'
import { pruneMissingFiles } from '../_shared/pruneMissingFiles.js'
import { translateOptions } from './options.js'

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

import type { CreateDiagnostic } from '../../types.js'
import { parseArgsStringToArgv } from './argv.js'

const __filename = fileURLToPath(import.meta.url)

const createDiagnostic: CreateDiagnostic<'stylelint'> = (pluginConfig) => {
  let terminal = true

  return {
    config: async ({ enableTerminal }) => {
      terminal = enableTerminal
    },
    async configureServer({ root, watch }) {
      if (!pluginConfig.stylelint) return

      const translatedOptions = await translateOptions(
        pluginConfig.stylelint.lintCommand,
      )
      const baseConfig = {
        cwd: root,
        ...translatedOptions,
        ...pluginConfig.stylelint.dev?.overrideConfig,
      } as const

      const logLevel = (() => {
        if (typeof pluginConfig.stylelint !== 'object') return undefined
        const userLogLevel = pluginConfig.stylelint.dev?.logLevel
        if (!userLogLevel) return undefined
        const map = {
          error: DiagnosticLevel.Error,
          warning: DiagnosticLevel.Warning,
        } as const

        return userLogLevel.map((l) => map[l])
      })()

      const dispatchDiagnostics = () => {
        pruneMissingFiles(manager)
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        if (terminal) {
          for (const d of diagnostics) {
            consoleLog(
              diagnosticToTerminalLog(d, 'Stylelint'),
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
            composeCheckerSummary('Stylelint', errorCount, warningCount),
            errorCount ? 'error' : warningCount ? 'warn' : 'info',
          )
        }

        reportDiagnostics(diagnostics)
      }

      const scheduler = createLintScheduler({
        debounceMs:
          pluginConfig.stylelint.dev?.debounceMs ?? DEFAULT_DEBOUNCE_MS,
        onBatch: async (files) => {
          reportStatus('checking')
          try {
            const { results, ruleMetadata } = await stylelint.lint({
              ...baseConfig,
              files,
            })
            const newDiagnostics = results.flatMap((d) =>
              normalizeStylelintDiagnostic(d, ruleMetadata),
            )
            applyBatchedDiagnostics(manager, files, newDiagnostics, root)
          } catch (error) {
            reportStatus('failed', error)
            throw error
          }
          dispatchDiagnostics()
        },
      })

      // initial lint
      const { results: diagnostics, ruleMetadata } =
        await stylelint.lint(baseConfig)

      manager.initWith(
        diagnostics.flatMap((p) =>
          normalizeStylelintDiagnostic(p, ruleMetadata),
        ),
      )
      dispatchDiagnostics()

      // watch lint
      let watchTarget: string | string[] = root
      if (pluginConfig.stylelint.watchPath) {
        if (Array.isArray(pluginConfig.stylelint.watchPath)) {
          watchTarget = pluginConfig.stylelint.watchPath.map((p) =>
            path.resolve(root, p),
          )
        } else {
          watchTarget = path.resolve(root, pluginConfig.stylelint.watchPath)
        }
      }

      watchLintTargets(watchTarget, {
        root,
        watch,
        ignored: createIgnore(root, translatedOptions.files),
        onChange: (absPath) => scheduler.schedule(absPath),
        onUnlink: (absPath) => {
          manager.updateByFileId(absPath, [])
          dispatchDiagnostics()
        },
      })
    },
  }
}

export class StylelintChecker extends Checker<'stylelint'> {
  public constructor() {
    super({
      name: 'stylelint',
      absFilePath: __filename,
      build: {
        buildBin: (pluginConfig) => {
          if (pluginConfig.stylelint) {
            const { lintCommand } = pluginConfig.stylelint
            return ['stylelint', parseArgsStringToArgv(lintCommand).slice(1)]
          }
          return ['stylelint', []]
        },
      },
      createDiagnostic,
    })
  }

  public init() {
    const _createServeAndBuild = super.initMainThread()
    createServeAndBuild = _createServeAndBuild
    super.initWorkerThread()
  }
}

export { createServeAndBuild }

const stylelintChecker = new StylelintChecker()
stylelintChecker.prepare()
stylelintChecker.init()
