import type {
  Diagnostic,
  DiagnosticSeverity,
} from '../../vite-plugin-checker/src/protocol'
import { type CheckerView, diagnosticsOf } from './state'

export type GroupBy = 'file' | 'checker'

export interface Filters {
  query: string
  levels: Record<DiagnosticSeverity, boolean>
  hiddenCheckers: string[]
  groupBy: GroupBy
}

export interface Group {
  key: string
  title: string
  /** set when the group is a file */
  file?: string
  diagnostics: Diagnostic[]
}

export type Counts = Record<DiagnosticSeverity, number>

export const defaultFilters = (): Filters => ({
  query: '',
  levels: { error: true, warning: true, info: false },
  hiddenCheckers: [],
  groupBy: 'file',
})

const severityRank: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

export function countLevels(diagnostics: Diagnostic[]): Counts {
  const counts: Counts = { error: 0, warning: 0, info: 0 }
  for (const diagnostic of diagnostics) counts[diagnostic.level]++
  return counts
}

function matches(diagnostic: Diagnostic, query: string) {
  if (!query) return true
  const needle = query.toLowerCase()
  return [diagnostic.message, diagnostic.code, diagnostic.displayFile].some(
    (value) => value?.toLowerCase().includes(needle),
  )
}

function compareDiagnostics(a: Diagnostic, b: Diagnostic) {
  return (
    (a.line ?? 0) - (b.line ?? 0) ||
    (a.column ?? 0) - (b.column ?? 0) ||
    severityRank[a.level] - severityRank[b.level]
  )
}

export function filterDiagnostics(
  checkers: CheckerView[],
  filters: Filters,
): Diagnostic[] {
  const query = filters.query.trim()
  return checkers
    .filter((checker) => !filters.hiddenCheckers.includes(checker.id))
    .flatMap(diagnosticsOf)
    .filter((d) => filters.levels[d.level] && matches(d, query))
}

export function groupDiagnostics(
  diagnostics: Diagnostic[],
  checkers: CheckerView[],
  groupBy: GroupBy,
): Group[] {
  const groups = new Map<string, Group>()

  for (const diagnostic of diagnostics) {
    const key =
      groupBy === 'file' ? (diagnostic.file ?? '') : diagnostic.checkerId
    let group = groups.get(key)
    if (!group) {
      group =
        groupBy === 'file'
          ? {
              key,
              title: diagnostic.displayFile ?? (key || 'Other'),
              ...(key ? { file: key } : {}),
              diagnostics: [],
            }
          : {
              key,
              title:
                checkers.find((c) => c.id === key)?.label ??
                diagnostic.checkerId,
              diagnostics: [],
            }
      groups.set(key, group)
    }
    group.diagnostics.push(diagnostic)
  }

  const order = checkers.map((c) => c.id)
  return [...groups.values()]
    .map((group) => ({
      ...group,
      diagnostics: group.diagnostics.sort(
        groupBy === 'file'
          ? compareDiagnostics
          : (a, b) =>
              (a.displayFile ?? '').localeCompare(b.displayFile ?? '') ||
              compareDiagnostics(a, b),
      ),
    }))
    .sort((a, b) =>
      groupBy === 'file'
        ? (a.file ? 0 : 1) - (b.file ? 0 : 1) || a.title.localeCompare(b.title)
        : order.indexOf(a.key) - order.indexOf(b.key),
    )
}

export interface GroupWindow {
  group: Group
  /** number of the group's diagnostics to render */
  shown: number
}

/**
 * Select the groups and diagnostics to render so that at most `limit`
 * diagnostics of expanded groups are in the DOM. Collapsed groups cost nothing.
 */
export function windowGroups(
  groups: Group[],
  limit: number,
  isCollapsed: (group: Group) => boolean,
): { windows: GroupWindow[]; remaining: number } {
  const windows: GroupWindow[] = []
  let budget = limit
  let remaining = 0
  for (const group of groups) {
    if (isCollapsed(group)) {
      windows.push({ group, shown: 0 })
      continue
    }
    const shown = Math.min(group.diagnostics.length, budget)
    if (shown > 0) windows.push({ group, shown })
    budget -= shown
    remaining += group.diagnostics.length - shown
  }
  return { windows, remaining }
}
