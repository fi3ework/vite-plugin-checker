import path from 'node:path'
import chokidar from 'chokidar'
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel } from '../../logger.js'
import { runOxlint } from './cli.js'
import { dispatchDiagnostics } from './diagnostics.js'
import type { ResolvedOptions } from './options.js'
import type { DisplayTarget } from './types'

export async function setupDevServer(
  root: string,
  options: ResolvedOptions,
  manager: FileDiagnosticManager,
  displayTargets: Set<DisplayTarget>,
): Promise<void> {
  const initial = await runOxlint(options.command, root)
  manager.initWith(initial)
  dispatchDiagnostics(
    filterLogLevel(manager.getDiagnostics(), options.logLevel),
    displayTargets,
  )

  const watcher = chokidar.watch(options.watchTarget, {
    cwd: root,
    ignored: (path: string) => path.includes('node_modules'),
  })

  watcher.on('change', async (filePath) => {
    await handleFileChange(root, options.command, filePath, manager)
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )
  })

  watcher.on('unlink', (filePath) => {
    handleFileUnlink(root, filePath, manager)
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )
  })

  watcher.add('.')
}

function handleFileUnlink(
  root: string,
  filePath: string,
  manager: FileDiagnosticManager,
) {
  const absPath = path.resolve(root, filePath)
  manager.updateByFileId(absPath, [])
}

async function handleFileChange(
  root: string,
  command: string,
  filePath: string,
  manager: FileDiagnosticManager,
) {
  const absPath = path.resolve(root, filePath)

  const isConfigFile = path.basename(absPath) === '.oxlintrc.json'
  if (isConfigFile) {
    const diagnostics = await runOxlint(`${command} ${root}`, root)
    manager.initWith(diagnostics)
  } else {
    const diagnostics = await runOxlint(`${command} ${absPath}`, root)
    manager.updateByFileId(absPath, diagnostics)
  }
}
