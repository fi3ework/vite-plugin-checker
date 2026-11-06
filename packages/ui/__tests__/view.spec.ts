import { describe, expect, it } from 'vitest'
import type { CheckerView } from '../src/state'
import {
  countLevels,
  defaultFilters,
  filterDiagnostics,
  groupDiagnostics,
  windowGroups,
} from '../src/view'
import { diagnostic } from './fixtures'

const checkers: CheckerView[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    status: 'idle',
    files: {
      '/root/src/b.ts': [
        diagnostic({
          id: 't1',
          file: '/root/src/b.ts',
          displayFile: 'src/b.ts',
          line: 9,
        }),
        diagnostic({
          id: 't2',
          file: '/root/src/b.ts',
          displayFile: 'src/b.ts',
          line: 2,
        }),
      ],
      '': [
        diagnostic({
          id: 't3',
          file: undefined,
          displayFile: undefined,
          message: 'No inputs',
        }),
      ],
    },
  },
  {
    id: 'eslint',
    label: 'ESLint',
    status: 'idle',
    files: {
      '/root/src/a.ts': [
        diagnostic({
          id: 'e1',
          checkerId: 'eslint',
          level: 'warning',
          code: 'no-var',
        }),
        diagnostic({ id: 'e2', checkerId: 'eslint', level: 'info' }),
      ],
    },
  },
]

const ids = (list: { id: string }[]) => list.map((d) => d.id)

describe('filterDiagnostics', () => {
  it('hides info by default', () => {
    expect(ids(filterDiagnostics(checkers, defaultFilters()))).toEqual([
      't1',
      't2',
      't3',
      'e1',
    ])
  })

  it('filters by checker, level and query', () => {
    const filters = defaultFilters()
    filters.hiddenCheckers = ['typescript']
    filters.levels.info = true
    expect(ids(filterDiagnostics(checkers, filters))).toEqual(['e1', 'e2'])

    filters.query = ' NO-VAR '
    expect(ids(filterDiagnostics(checkers, filters))).toEqual(['e1'])

    filters.hiddenCheckers = []
    filters.query = 'src/b'
    expect(ids(filterDiagnostics(checkers, filters))).toEqual(['t1', 't2'])
  })
})

describe('groupDiagnostics', () => {
  const all = filterDiagnostics(checkers, {
    ...defaultFilters(),
    levels: { error: true, warning: true, info: true },
  })

  it('groups by file with file-less diagnostics last', () => {
    const groups = groupDiagnostics(all, checkers, 'file')
    expect(groups.map((g) => [g.title, ids(g.diagnostics)])).toEqual([
      ['src/a.ts', ['e1', 'e2']],
      ['src/b.ts', ['t2', 't1']],
      ['Other', ['t3']],
    ])
    expect(groups[0]!.file).toBe('/root/src/a.ts')
    expect(groups[2]!.file).toBeUndefined()
  })

  it('windows groups to a diagnostic limit, skipping collapsed groups', () => {
    const groups = groupDiagnostics(all, checkers, 'file')
    const shown = (limit: number, collapsed: string[] = []) => {
      const { windows, remaining } = windowGroups(groups, limit, (g) =>
        collapsed.includes(g.title),
      )
      return [windows.map((w) => [w.group.title, w.shown]), remaining]
    }

    expect(shown(3)).toEqual([
      [
        ['src/a.ts', 2],
        ['src/b.ts', 1],
      ],
      2,
    ])
    expect(shown(3, ['src/a.ts'])).toEqual([
      [
        ['src/a.ts', 0],
        ['src/b.ts', 2],
        ['Other', 1],
      ],
      0,
    ])
    expect(shown(2)).toEqual([[['src/a.ts', 2]], 3])
    expect(shown(2, ['Other'])).toEqual([
      [
        ['src/a.ts', 2],
        ['Other', 0],
      ],
      2,
    ])
  })

  it('groups by checker in checker order', () => {
    const groups = groupDiagnostics(all, checkers, 'checker')
    expect(groups.map((g) => [g.title, ids(g.diagnostics)])).toEqual([
      ['TypeScript', ['t3', 't2', 't1']],
      ['ESLint', ['e1', 'e2']],
    ])
  })
})

it('countLevels', () => {
  expect(
    countLevels(checkers.flatMap((c) => Object.values(c.files).flat())),
  ).toEqual({
    error: 3,
    warning: 1,
    info: 1,
  })
})
