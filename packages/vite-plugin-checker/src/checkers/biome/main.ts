import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Checker } from '../../Checker.js'
import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToConsoleLevel,
  diagnosticToTerminalLog,
  filterLogLevel,
  reportDiagnostics,
  reportStatus,
} from '../../logger.js'
import { type CreateDiagnostic, DiagnosticLevel } from '../../types.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import {
  createLintScheduler,
  DEFAULT_DEBOUNCE_MS,
} from '../_shared/lintScheduler.js'
import { watchLintTargets } from '../_shared/lintWatcher.js'
import { pruneMissingFiles } from '../_shared/pruneMissingFiles.js'
import { parseArgsStringToArgv } from '../stylelint/argv.js'
import {
  getBiomeCommand,
  getBiomeDevArgs,
  runBiome,
  severityMap,
} from './cli.js'

const __filename = fileURLToPath(import.meta.url)

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<'biome'> = (pluginConfig) => {
  const biomeConfig = pluginConfig.biome
  let terminal = true

  let command = 'lint'
  let flags = ''

  if (typeof biomeConfig === 'object') {
    command = biomeConfig?.dev?.command || biomeConfig?.command || 'lint'
    flags = biomeConfig?.dev?.flags || biomeConfig?.flags || ''
  }

  return {
    config: async ({ enableTerminal }) => {
      terminal = enableTerminal
    },
    async configureServer({ root, watch }) {
      if (!biomeConfig) return

      const args = getBiomeDevArgs(flags)

      const logLevel = (() => {
        if (typeof biomeConfig !== 'object') return undefined
        const userLogLevel = biomeConfig.dev?.logLevel
        if (!userLogLevel) return undefined

        return userLogLevel.map((l) => severityMap[l])
      })()

      const dispatchDiagnostics = () => {
        pruneMissingFiles(manager)
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        if (terminal) {
          for (const d of diagnostics) {
            consoleLog(
              diagnosticToTerminalLog(d, 'Biome'),
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
            composeCheckerSummary('Biome', errorCount, warningCount),
            errorCount ? 'error' : warningCount ? 'warn' : 'info',
          )
        }

        reportDiagnostics(diagnostics)
      }

      const scheduler = createLintScheduler({
        debounceMs:
          (typeof biomeConfig === 'object'
            ? biomeConfig.dev?.debounceMs
            : undefined) ?? DEFAULT_DEBOUNCE_MS,
        onBatch: async (files) => {
          reportStatus('checking')
          const hasConfigChange = files.some(
            (f) => path.basename(f) === 'biome.json',
          )
          if (hasConfigChange) {
            const diagnostics = await runBiome(
              getBiomeCommand(command, args, [root]),
              root,
            )
            manager.initWith(diagnostics)
          } else {
            const diagnostics = await runBiome(
              getBiomeCommand(command, args, files),
              root,
            )
            applyBatchedDiagnostics(manager, files, diagnostics, root)
          }
          dispatchDiagnostics()
        },
      })

      // initial check
      const diagnostics = await runBiome(
        getBiomeCommand(command, args, [root]),
        root,
      )

      manager.initWith(diagnostics)
      dispatchDiagnostics()

      // watch lint
      let watchTarget: string | string[] = root
      if (typeof biomeConfig === 'object' && biomeConfig.watchPath) {
        if (Array.isArray(biomeConfig.watchPath)) {
          watchTarget = biomeConfig.watchPath.map((p) => path.resolve(root, p))
        } else {
          watchTarget = path.resolve(root, biomeConfig.watchPath)
        }
      }

      watchLintTargets(watchTarget, {
        root,
        watch,
        onChange: (absPath) => scheduler.schedule(absPath),
        onUnlink: (absPath) => {
          manager.updateByFileId(absPath, [])
          dispatchDiagnostics()
        },
      })
    },
  }
}

export class BiomeChecker extends Checker<'biome'> {
  public constructor() {
    super({
      name: 'biome',
      absFilePath: __filename,
      build: {
        buildBin: (pluginConfig) => {
          if (typeof pluginConfig.biome === 'object') {
            const { command, flags, build } = pluginConfig.biome
            const buildCommand = build?.command || command || 'check'
            const buildFlags = build?.flags || flags
            return [
              'biome',
              [
                buildCommand,
                ...(buildFlags ? parseArgsStringToArgv(buildFlags) : []),
              ],
            ] as const
          }
          return ['biome', ['check']]
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

const biomeChecker = new BiomeChecker()
biomeChecker.prepare()
biomeChecker.init()
