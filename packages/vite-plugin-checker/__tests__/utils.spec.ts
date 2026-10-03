import { describe, expect, it } from 'vitest'

import { ignoreTransientFsError, isTransientFsError } from '../src/utils'

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
