import path from 'node:path'
import chokidar from 'chokidar'
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel } from '../../logger.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import { createLintScheduler } from '../_shared/lintScheduler.js'
import { runOxlint } from './cli.js'
import { dispatchDiagnostics } from './diagnostics.js'
import type { ResolvedOptions } from './options.js'
import type { DisplayTarget } from './types'

const DEBOUNCE_MS = 300

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

  const dispatch = () =>
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )

  const scheduler = createLintScheduler({
    debounceMs: DEBOUNCE_MS,
    onBatch: async (files) => {
      const hasConfigChange = files.some(
        (f) => path.basename(f) === '.oxlintrc.json',
      )
      if (hasConfigChange) {
        const diagnostics = await runOxlint(`${options.command} ${root}`, root)
        manager.initWith(diagnostics)
      } else {
        const diagnostics = await runOxlint(
          `${options.command} ${files.join(' ')}`,
          root,
        )
        applyBatchedDiagnostics(manager, files, diagnostics, root)
      }
      dispatch()
    },
  })

  const watcher = chokidar.watch(options.watchTarget, {
    cwd: root,
    ignored: (p: string) => p.includes('node_modules'),
  })

  watcher.on('change', (filePath) => {
    scheduler.schedule(path.resolve(root, filePath))
  })

  watcher.on('unlink', (filePath) => {
    const absPath = path.resolve(root, filePath)
    manager.updateByFileId(absPath, [])
    dispatch()
  })
}
