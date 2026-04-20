import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parentPort } from 'node:worker_threads'
import chokidar from 'chokidar'
import { Checker } from '../../Checker.js'
import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToConsoleLevel,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  filterLogLevel,
  toClientPayload,
} from '../../logger.js'
import {
  ACTION_TYPES,
  type CreateDiagnostic,
  DiagnosticLevel,
} from '../../types.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import {
  createLintScheduler,
  DEFAULT_DEBOUNCE_MS,
} from '../_shared/lintScheduler.js'
import { getBiomeCommand, runBiome, severityMap } from './cli.js'

const __filename = fileURLToPath(import.meta.url)

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<'biome'> = (pluginConfig) => {
  const biomeConfig = pluginConfig.biome
  let overlay = true
  let terminal = true

  let command = 'lint'
  let flags = ''

  if (typeof biomeConfig === 'object') {
    command = biomeConfig?.dev?.command || biomeConfig?.command || 'lint'
    flags = biomeConfig?.dev?.flags || biomeConfig?.flags || ''
  }

  return {
    config: async ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    async configureServer({ root }) {
      if (!biomeConfig) return

      const logLevel = (() => {
        if (typeof biomeConfig !== 'object') return undefined
        const userLogLevel = biomeConfig.dev?.logLevel
        if (!userLogLevel) return undefined

        return userLogLevel.map((l) => severityMap[l])
      })()

      const dispatchDiagnostics = () => {
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

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toClientPayload(
              'biome',
              diagnostics.map((d) => diagnosticToRuntimeError(d)),
            ),
          })
        }
      }

      const scheduler = createLintScheduler({
        debounceMs: DEFAULT_DEBOUNCE_MS,
        onBatch: async (files) => {
          const hasConfigChange = files.some(
            (f) => path.basename(f) === 'biome.json',
          )
          if (hasConfigChange) {
            const diagnostics = await runBiome(
              getBiomeCommand(command, flags, [root]),
              root,
            )
            manager.initWith(diagnostics)
          } else {
            const diagnostics = await runBiome(
              getBiomeCommand(command, flags, files),
              root,
            )
            applyBatchedDiagnostics(manager, files, diagnostics, root)
          }
          dispatchDiagnostics()
        },
      })

      // initial check
      const diagnostics = await runBiome(
        getBiomeCommand(command, flags, [root]),
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

      const watcher = chokidar.watch(watchTarget, {
        cwd: root,
        ignored: (p: string) => p.includes('node_modules'),
      })
      watcher.on('change', (filePath) => {
        scheduler.schedule(path.resolve(root, filePath))
      })
      watcher.on('unlink', (filePath) => {
        const absPath = path.resolve(root, filePath)
        manager.updateByFileId(absPath, [])
        dispatchDiagnostics()
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
            const { command, flags } = pluginConfig.biome
            return ['biome', [command || 'check', flags || ''] as const]
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
