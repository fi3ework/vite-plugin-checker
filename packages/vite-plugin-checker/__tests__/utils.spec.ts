import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

import {
  ignoreTransientFsError,
  isTransientFsError,
  quoteShellArg,
} from '../src/utils'

function withPlatform(platform: NodeJS.Platform, run: () => void) {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')!
  Object.defineProperty(process, 'platform', { ...descriptor, value: platform })
  try {
    run()
  } finally {
    Object.defineProperty(process, 'platform', descriptor)
  }
}

const fsError = (code: string) => Object.assign(new Error(code), { code })

describe('isTransientFsError', () => {
  it.each(['ENOENT', 'EBUSY', 'EPERM', 'EACCES'])(
    'treats %s as transient',
    (code) => {
      expect(isTransientFsError(fsError(code))).toBe(true)
    },
  )

  it('does not treat unrelated error codes as transient', () => {
    expect(isTransientFsError(fsError('EISDIR'))).toBe(false)
  })

  it('returns false for errors without a code and non-error values', () => {
    expect(isTransientFsError(new Error('boom'))).toBe(false)
    expect(isTransientFsError('ENOENT')).toBe(false)
    expect(isTransientFsError(null)).toBe(false)
    expect(isTransientFsError(undefined)).toBe(false)
  })
})

describe('ignoreTransientFsError', () => {
  it('swallows transient FS errors', () => {
    expect(() => ignoreTransientFsError(fsError('ENOENT'))).not.toThrow()
  })

  it('rethrows anything else so genuine failures still surface', () => {
    const error = fsError('EISDIR')
    expect(() => ignoreTransientFsError(error)).toThrow(error)
  })
})

describe('quoteShellArg', () => {
  it('keeps a path containing spaces in one argument', () => {
    withPlatform('linux', () => {
      expect(quoteShellArg('/repo/my apps/tsconfig.json')).toBe(
        "'/repo/my apps/tsconfig.json'",
      )
    })
  })

  it('escapes quotes that the path itself contains', () => {
    withPlatform('linux', () => {
      expect(quoteShellArg("/repo/it's/tsconfig.json")).toBe(
        "'/repo/it'\\''s/tsconfig.json'",
      )
    })

    withPlatform('win32', () => {
      expect(quoteShellArg('C:\\my apps\\tsconfig.json')).toBe(
        '"C:\\my apps\\tsconfig.json"',
      )
    })
  })

  it('leaves an empty argument alone', () => {
    expect(quoteShellArg('')).toBe('')
  })

  it.skipIf(process.platform === 'win32')(
    'survives a round trip through a real shell',
    () => {
      const target = '/repo/my apps/tsconfig.json'
      const command = [
        quoteShellArg(process.execPath),
        '-e',
        quoteShellArg('console.log(JSON.stringify(process.argv.slice(1)))'),
        quoteShellArg(target),
      ].join(' ')

      const { stdout, status } = spawnSync(command, {
        shell: true,
        encoding: 'utf8',
      })

      expect(status).toBe(0)
      expect(JSON.parse(stdout)).toEqual([target])
    },
  )
})
