import { defaultFilters, type Filters } from './view'

export interface Preferences {
  filters: Filters
  collapsed: string[]
}

const key = `vite-plugin-checker:${location.pathname}`

export function loadPreferences(): Preferences {
  const defaults = { filters: defaultFilters(), collapsed: [] }
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!stored || typeof stored !== 'object') return defaults
    return {
      filters: {
        ...defaults.filters,
        ...stored.filters,
        query: '',
        levels: { ...defaults.filters.levels, ...stored.filters?.levels },
      },
      collapsed: Array.isArray(stored.collapsed) ? stored.collapsed : [],
    }
  } catch {
    return defaults
  }
}

export function savePreferences({ filters, collapsed }: Preferences) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ filters: { ...filters, query: '' }, collapsed }),
    )
  } catch {}
}
