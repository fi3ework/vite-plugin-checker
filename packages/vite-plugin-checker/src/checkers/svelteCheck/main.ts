import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import { Checker } from '../../Checker.js'
import { colorize } from '../../colors.js'
import {
  composeCheckerSummary,
  consoleLog,
  diagnosticToConsoleLevel,
  diagnosticToTerminalLog,
  filterLogLevel,
  type NormalizedDiagnostic,
  reportDiagnostics,
  reportStatus,
} from '../../logger.js'
import { type CreateDiagnostic, DiagnosticLevel } from '../../types.js'
import { parseArgsStringToArgv } from '../stylelint/argv.js'
import {
  createMachineOutputParser,
  getDevArgs,
  resolveSvelteCheckBin,
} from './cli.js'

const __filename = fileURLToPath(import.meta.url)

const severityMap = {
  error: DiagnosticLevel.Error,
  warning: DiagnosticLevel.Warning,
} as const

const createDiagnostic: CreateDiagnostic<'svelteCheck'> = (pluginConfig) => {
  const svelteCheckConfig = pluginConfig.svelteCheck
  let terminal = true

  return {
    config: async ({ enableTerminal }) => {
      terminal = enableTerminal
    },
    configureServer({ root }) {
      if (!svelteCheckConfig) return

      const options =
        typeof svelteCheckConfig === 'object' ? svelteCheckConfig : {}
      const logLevel = options.dev?.logLevel?.map((l) => severityMap[l])

      const dispatchDiagnostics = (all: NormalizedDiagnostic[]) => {
        const diagnostics = filterLogLevel(all, logLevel)

        if (terminal) {
          for (const d of diagnostics) {
            consoleLog(
              diagnosticToTerminalLog(d, 'svelte-check'),
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
            composeCheckerSummary('svelte-check', errorCount, warningCount),
            errorCount ? 'error' : warningCount ? 'warn' : 'info',
          )
        }

        reportDiagnostics(diagnostics)
      }

      let bin: string
      try {
        bin = resolveSvelteCheckBin(root)
      } catch {
        const message = `could not resolve svelte-check from ${root}. Make sure it is installed.`
        consoleLog(colorize('yellow', `[svelte-check] ${message}`), 'warn')
        reportStatus('failed', message)
        return
      }

      // Nested so svelte-check is terminated along with this worker.
      const worker = new Worker(`require(${JSON.stringify(bin)})`, {
        eval: true,
        argv: getDevArgs(options.flags ?? '', root),
        stdout: true,
      })

      const parser = createMachineOutputParser({
        onStart: () => reportStatus('checking'),
        onComplete: dispatchDiagnostics,
        onFailure: (message) => {
          consoleLog(colorize('red', `[svelte-check] ${message}`), 'error')
          reportStatus('failed', message)
        },
      })

      readline
        .createInterface({ input: worker.stdout })
        .on('line', (line) => parser.push(line))

      worker.on('error', (error) => {
        consoleLog(colorize('red', `[svelte-check] ${error}`), 'error')
        reportStatus('failed', error)
      })
    },
  }
}

export class SvelteCheckChecker extends Checker<'svelteCheck'> {
  public constructor() {
    super({
      name: 'svelteCheck',
      absFilePath: __filename,
      build: {
        buildBin: ({ svelteCheck }) => {
          const flags =
            typeof svelteCheck === 'object' ? (svelteCheck.flags ?? '') : ''
          return ['svelte-check', parseArgsStringToArgv(flags)]
        },
      },
      createDiagnostic,
    })
  }
}

const svelteCheck = new SvelteCheckChecker()
svelteCheck.prepare()
svelteCheck.initWorkerThread()

export const createServeAndBuild = svelteCheck.initMainThread()
