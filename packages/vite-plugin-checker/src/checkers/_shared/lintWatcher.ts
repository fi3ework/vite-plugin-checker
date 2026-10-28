import path from 'node:path'
import chokidar, { type FSWatcher, type Matcher } from 'chokidar'
import colors from 'picocolors'
import { consoleLog } from '../../logger.js'

const ALWAYS_IGNORED_RE = /(?:^|[\\/])(?:node_modules|\.git)(?:[\\/]|$)/

export interface LintWatcherOptions {
  root: string
  ignored?: Matcher
  onChange: (absPath: string) => void
  onUnlink: (absPath: string) => void
}

/**
 * Watch lint targets for added, changed and removed files. `node_modules`
 * and `.git` below `root` are never watched, and watcher errors are logged
 * instead of crashing the worker.
 */
export function watchLintTargets(
  target: string | string[],
  { root, ignored, onChange, onUnlink }: LintWatcherOptions,
): FSWatcher {
  const watcher = chokidar.watch(target, {
    cwd: root,
    ignoreInitial: true,
    ignored: [
      (p: string) => ALWAYS_IGNORED_RE.test(path.relative(root, p)),
      ...(ignored ? [ignored] : []),
    ],
  })

  const toAbsolute = (filePath: string) => path.resolve(root, filePath)
  watcher.on('add', (filePath) => onChange(toAbsolute(filePath)))
  watcher.on('change', (filePath) => onChange(toAbsolute(filePath)))
  watcher.on('unlink', (filePath) => onUnlink(toAbsolute(filePath)))

  const reported = new Set<string>()
  watcher.on('error', (error) => {
    const { code, message } = error as NodeJS.ErrnoException
    const key = code ?? message
    if (reported.has(key)) return
    reported.add(key)
    consoleLog(
      colors.yellow(`vite-plugin-checker file watcher error: ${message}`),
      'warn',
    )
  })

  return watcher
}
