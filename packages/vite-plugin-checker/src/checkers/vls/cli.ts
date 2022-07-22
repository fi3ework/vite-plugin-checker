import { Command, Option } from 'commander'
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)
import { diagnostics, LogLevel, logLevels } from './diagnostics.js'

function getVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version }: { version: string } = _require('../../../package.json')
  return `v${version}`
}

function validateLogLevel(logLevelInput: unknown): logLevelInput is LogLevel {
  return (
    typeof logLevelInput === 'string' &&
    (logLevels as ReadonlyArray<string>).includes(logLevelInput)
  )
}

;(async () => {
  const program = new Command()
  program.name('vti').description('Vetur Terminal Interface').version(getVersion())

  program
    .command('diagnostics [workspace]')
    .description('Print all diagnostics')
    .addOption(
      new Option('-c, --checker-config <checkerConfig>', 'Option overrides to pass to VTI').default(
        '{}'
      )
    )
    .addOption(
      new Option('-l, --log-level <logLevel>', 'Log level to print')
        .default('WARN')
        // logLevels is readonly array but .choices need read-write array (because of weak typing)
        .choices(logLevels as unknown as string[])
    )
    .action(async (workspace, options) => {
      const logLevelOption: unknown = options.logLevel

      if (!validateLogLevel(logLevelOption)) {
        throw new Error(`Invalid log level: ${logLevelOption}`)
      }

      let parsedConfig
      try {
        parsedConfig = JSON.parse(options.checkerConfig) as any
      } catch {
        throw new Error(`Unable to parse checker-config JSON: ${options.checkerConfig}`)
      }

      await diagnostics(workspace, logLevelOption, {
        watch: false,
        verbose: false,
        config: parsedConfig,
      })
    })

  program.parse(process.argv)
})().catch((err) => {
  console.error(`VTI operation failed with error`)
  console.error(err.stack)
  process.exit(1)
})
