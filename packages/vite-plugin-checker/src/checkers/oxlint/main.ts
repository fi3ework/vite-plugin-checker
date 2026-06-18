import { fileURLToPath } from 'node:url'
import { Checker } from '../../Checker.js'
import parseArgsStringToArgv from '../stylelint/argv.js'
import { createDiagnostic } from './diagnostics.js'

const __filename = fileURLToPath(import.meta.url)

export class OxlintChecker extends Checker<'oxlint'> {
  public constructor() {
    super({
      name: 'oxlint',
      absFilePath: __filename,
      build: {
        buildBin: ({ oxlint }) => {
          const commandStr =
            typeof oxlint === 'boolean'
              ? 'oxlint'
              : (oxlint?.lintCommand ?? 'oxlint')
          const command = parseArgsStringToArgv(commandStr)
          return [command[0]!, command.slice(1)]
        },
      },
      createDiagnostic,
    })
  }
}

const oxlint = new OxlintChecker()
oxlint.prepare()
oxlint.initWorkerThread()

export const createServeAndBuild = oxlint.initMainThread()
