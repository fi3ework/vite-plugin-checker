import path from 'node:path'
import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel } from '../../logger.js'
import { applyBatchedDiagnostics } from '../_shared/applyBatchedDiagnostics.js'
import {
  createLintScheduler,
  DEFAULT_DEBOUNCE_MS,
} from '../_shared/lintScheduler.js'
import { watchLintTargets } from '../_shared/lintWatcher.js'
import { pruneMissingFiles } from '../_shared/pruneMissingFiles.js'
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
  const dispatch = () => {
    pruneMissingFiles(manager)
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )
  }

  const initial = await runOxlint(options.command, root)
  manager.initWith(initial)
  dispatch()

  const scheduler = createLintScheduler({
    debounceMs: options.debounceMs ?? DEFAULT_DEBOUNCE_MS,
    onBatch: async (files) => {
      const hasConfigChange = files.some(
        (f) => path.basename(f) === '.oxlintrc.json',
      )
      if (hasConfigChange) {
        const diagnostics = await runOxlint([...options.command, root], root)
        manager.initWith(diagnostics)
      } else {
        const diagnostics = await runOxlint(
          [...options.command, ...files],
          root,
        )
        applyBatchedDiagnostics(manager, files, diagnostics, root)
      }
      dispatch()
    },
  })

  watchLintTargets(options.watchTarget, {
    root,
    onChange: (absPath) => scheduler.schedule(absPath),
    onUnlink: (absPath) => {
      manager.updateByFileId(absPath, [])
      dispatch()
    },
  })
}
