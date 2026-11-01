import type { FileDiagnosticManager } from '../../FileDiagnosticManager.js'
import { filterLogLevel } from '../../logger.js'
import type { LintWatchOptions } from '../../types.js'
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
  watch?: LintWatchOptions,
): Promise<void> {
  const dispatch = () => {
    pruneMissingFiles(manager)
    dispatchDiagnostics(
      filterLogLevel(manager.getDiagnostics(), options.logLevel),
      displayTargets,
    )
  }

  const lint = async () => {
    manager.initWith(await runOxlint(options.command, root))
    dispatch()
  }

  await lint()

  const scheduler = createLintScheduler({
    debounceMs: options.debounceMs ?? DEFAULT_DEBOUNCE_MS,
    onBatch: lint,
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
