import path from 'node:path'
import { DiagnosticLevel, type OxlintConfig } from '../../types.js'
import { getOxlintCommand, mapSeverity } from './cli.js'

export interface ResolvedOptions {
  watchTarget: string | string[]
  logLevel?: DiagnosticLevel[]
  command: string
}

export function resolveOptions(
  root: string,
  config: Exclude<OxlintConfig, false>,
): ResolvedOptions {
  const options = config === true ? { lintCommand: 'oxlint' } : config
  return {
    watchTarget: resolveWatchTarget(root, options.watchPath),
    logLevel: options.dev?.logLevel?.map((l) => mapSeverity(l)) ?? [
      DiagnosticLevel.Warning,
      DiagnosticLevel.Error,
    ],
    command: getOxlintCommand(options.lintCommand ?? 'oxlint').join(' '),
  }
}

function resolveWatchTarget(
  root: string,
  watchPath?: string | string[],
): string | string[] {
  return Array.isArray(watchPath)
    ? watchPath.map((p) => path.resolve(root, p))
    : typeof watchPath === 'string'
      ? path.resolve(root, watchPath)
      : root
}
