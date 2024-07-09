import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parentPort } from 'node:worker_threads'
import chokidar from 'chokidar'
import { Checker } from '../../Checker.js'
import { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToRuntimeError,
  diagnosticToTerminalLog,
  filterLogLevel,
  toClientPayload,
} from '../../logger.js'
import { ACTION_TYPES, type CreateDiagnostic, DiagnosticLevel } from '../../types.js'
import { getBiomeCommand, runBiome, severityMap } from './cli.js'

const __filename = fileURLToPath(import.meta.url)

const manager = new FileDiagnosticManager()
let createServeAndBuild: any

const createDiagnostic: CreateDiagnostic<'biome'> = (pluginConfig) => {
  let overlay = true
  let terminal = true

  let command = ''
  let flags = ''

  if (typeof pluginConfig.biome === 'object') {
    command = pluginConfig.biome.command || ''
    flags = pluginConfig.biome.flags || ''
  }

  return {
    config: async ({ enableOverlay, enableTerminal }) => {
      overlay = enableOverlay
      terminal = enableTerminal
    },
    async configureServer({ root }) {
      if (!pluginConfig.biome) return

      const logLevel = (() => {
        if (typeof pluginConfig.biome !== 'object') return undefined
        const userLogLevel = pluginConfig.biome.dev?.logLevel
        if (!userLogLevel) return undefined

        return userLogLevel.map((l) => severityMap[l])
      })()

      const dispatchDiagnostics = () => {
        const diagnostics = filterLogLevel(manager.getDiagnostics(), logLevel)

        if (terminal) {
          for (const d of diagnostics) {
            consoleLog(diagnosticToTerminalLog(d, 'Biome'))
          }

          const errorCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Error).length
          const warningCount = diagnostics.filter((d) => d.level === DiagnosticLevel.Warning).length
          consoleLog(composeCheckerSummary('Biome', errorCount, warningCount))
        }

        if (overlay) {
          parentPort?.postMessage({
            type: ACTION_TYPES.overlayError,
            payload: toClientPayload(
              'biome',
              diagnostics.map((d) => diagnosticToRuntimeError(d))
            ),
          })
        }
      }

      const handleFileChange = async (filePath: string, type: 'change' | 'unlink') => {
        const absPath = path.resolve(root, filePath)
        if (type === 'unlink') {
          manager.updateByFileId(absPath, [])
        } else if (type === 'change') {
          const isConfigFile = path.basename(absPath) === 'biome.json'

          if (isConfigFile) {
            const runCommand = getBiomeCommand(command, flags, root)
            const diagnostics = await runBiome(runCommand, root)
            manager.initWith(diagnostics)
          } else {
            const runCommand = getBiomeCommand(command, flags, absPath)
            const diagnosticsOfChangedFile = await runBiome(runCommand, root)
            manager.updateByFileId(absPath, diagnosticsOfChangedFile)
          }
        }

        dispatchDiagnostics()
      }

      // initial check
      const runCommand = getBiomeCommand(command, flags, root)
      const diagnostics = await runBiome(runCommand, root)

      manager.initWith(diagnostics)
      dispatchDiagnostics()

      // watch lint
      const watcher = chokidar.watch([], {
        cwd: root,
        ignored: (path: string) => path.includes('node_modules'),
      })
      watcher.on('change', async (filePath) => {
        handleFileChange(filePath, 'change')
      })
      watcher.on('unlink', async (filePath) => {
        handleFileChange(filePath, 'unlink')
      })
      watcher.add('.')
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
            return ['biome', [command || 'lint', flags || ''] as const]
          }
          return ['biome', ['lint']]
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
