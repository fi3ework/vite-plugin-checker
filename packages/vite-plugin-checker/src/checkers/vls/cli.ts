// import { Command, Option } from 'commander'
import { commander } from 'vite-plugin-checker-vls'

import { diagnostics, LogLevel, logLevels } from './diagnostics'

function getVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version }: { version: string } = require('../../../package.json')
  return `v${version}`
}

function validateLogLevel(logLevelInput: unknown): logLevelInput is LogLevel {
  return (
    typeof logLevelInput === 'string' &&
    (logLevels as ReadonlyArray<string>).includes(logLevelInput)
  )
}

;(async () => {
  const program = new commander.Command()
  program.name('vti').description('Vetur Terminal Interface').version(getVersion())

  program
    .command('diagnostics [workspace]')
    .description('Print all diagnostics')
    .addOption(
      new commander.Option('-l, --log-level <logLevel>', 'Log level to print')
        .default('WARN')
        // logLevels is readonly array but .choices need read-write array (because of weak typing)
        .choices(logLevels as unknown as string[])
    )
    .action(async (workspace, options) => {
      const logLevelOption: unknown = options.logLevel

      if (!validateLogLevel(logLevelOption)) {
        throw new Error(`Invalid log level: ${logLevelOption}`)
      }

      await diagnostics(workspace, logLevelOption)
    })

  program.parse(process.argv)
})().catch((err) => {
  console.error(`VTI operation failed with error`)
  console.error(err.stack)
  process.exit(1)
})
