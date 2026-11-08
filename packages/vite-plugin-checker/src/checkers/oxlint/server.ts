import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel, reportStatus } from '../../logger.js'
import type { LintWatchOptions } from '../../types.js'
import {
  createLintScheduler,
  DEFAULT_DEBOUNCE_MS,
} from '../_shared/lintScheduler.js'
import { watchLintTargets } from '../_shared/lintWatcher.js'
import { pruneMissingFiles } from '../_shared/pruneMissingFiles.js'
import { runOxlint } from './cli.js'
import { type DisplayOptions, dispatchDiagnostics } from './diagnostics.js'
import type { ResolvedOptions } from './options.js'

export async function setupDevServer(
  root: string,
  options: ResolvedOptions,
  manager: FileDiagnosticManager,
  display: DisplayOptions,
  watch?: LintWatchOptions,
): Promise<void> {
  const dispatch = () => {
    pruneMissingFiles(manager)
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      display,
    )
  }

  const lint = async () => {
    manager.initWith(await runOxlint(options.command, root))
    dispatch()
  }

  await lint()

  const scheduler = createLintScheduler({
    debounceMs: options.debounceMs ?? DEFAULT_DEBOUNCE_MS,
    onBatch: async () => {
      reportStatus('checking')
      try {
        await lint()
      } catch (error) {
        reportStatus('failed', error)
        throw error
      }
    },
  })

  watchLintTargets(options.watchTarget, {
    root,
    watch,
    onChange: (absPath) => scheduler.schedule(absPath),
    onUnlink: (absPath) => {
      manager.updateByFileId(absPath, [])
      dispatch()
    },
  })
}
