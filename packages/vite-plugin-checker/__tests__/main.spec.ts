import { describe, expect, it } from 'vitest'

import {
  RUNTIME_CLIENT_ENTRY_PATH,
  RUNTIME_CLIENT_RUNTIME_PATH,
  wrapVirtualPrefix,
} from '../src/client'
import { checker } from '../src/main'

interface FilteredHook {
  filter: { id: RegExp }
  handler: (id: string) => unknown
}

function getHook(name: 'resolveId' | 'load') {
  return checker({})[name] as unknown as FilteredHook
}

const runtimeIds = [
  RUNTIME_CLIENT_RUNTIME_PATH,
  RUNTIME_CLIENT_ENTRY_PATH,
] as const

const unrelatedIds = [
  '/src/main.js',
  `${RUNTIME_CLIENT_RUNTIME_PATH}?import`,
  `/foo${RUNTIME_CLIENT_ENTRY_PATH}.js`,
]

describe('resolveId', () => {
  const hook = getHook('resolveId')

  it('resolves runtime ids to virtual ids', () => {
    for (const id of runtimeIds) {
      expect(hook.filter.id.test(id)).toBe(true)
      expect(hook.handler(id)).toBe(wrapVirtualPrefix(id))
    }
  })

  it('ignores other ids when the filter is not applied', () => {
    for (const id of unrelatedIds) {
      expect(hook.filter.id.test(id)).toBe(false)
      expect(hook.handler(id)).toBeUndefined()
    }
  })
})

describe('load', () => {
  const hook = getHook('load')

  it('matches only the virtual runtime ids', () => {
    for (const id of runtimeIds) {
      expect(hook.filter.id.test(wrapVirtualPrefix(id))).toBe(true)
    }
    for (const id of unrelatedIds) {
      expect(hook.filter.id.test(id)).toBe(false)
      expect(hook.handler(id)).toBeUndefined()
    }
  })
})
