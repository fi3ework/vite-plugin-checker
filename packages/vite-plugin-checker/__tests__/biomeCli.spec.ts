import { describe, expect, it, vi } from 'vitest'

import { getBiomeCommand, getBiomeDevArgs } from '../src/checkers/biome/cli'

describe('biome getBiomeDevArgs', () => {
  it('keeps user flags', () => {
    expect(getBiomeDevArgs('--max-diagnostics=10 --error-on-warnings')).toEqual(
      ['--max-diagnostics=10', '--error-on-warnings'],
    )
  })

  it('drops reporter flags and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(
      getBiomeDevArgs(
        '--reporter=github --error-on-warnings --reporter junit --reporter-file report.xml',
      ),
    ).toEqual(['--error-on-warnings'])
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('biome getBiomeCommand', () => {
  it('appends the json reporter and the files', () => {
    expect(getBiomeCommand('lint', ['--error-on-warnings'], ['src'])).toEqual([
      'biome',
      'lint',
      '--error-on-warnings',
      '--reporter',
      'json',
      'src',
    ])
  })
})
