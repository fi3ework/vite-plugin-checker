import cp from 'child_process'
import os from 'os'

import CheckerPlugin from '../../lib/main'
import { VlsChecker } from '../../../checker-vls/lib/main'
import { MockSandbox } from './MockSandbox/MockSandbox'

// ref https://github.com/facebook/jest/issues/936#issuecomment-613220940
jest.mock('child_process', () => {
  const spawnFn = jest.fn()
  const onFn = jest.fn()
  spawnFn.mockReturnValue({ on: onFn })

  return {
    ...jest.requireActual('child_process'),
    spawn: spawnFn,
  }
})

describe('build', () => {
  let sandbox!: MockSandbox
  const spawnOptions = expect.objectContaining({
    cwd: expect.any(String),
    stdio: 'inherit',
    env: expect.any(Object),
    shell: os.platform() === 'win32',
  })

  beforeAll(() => {
    sandbox = new MockSandbox()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('typescript', () => {
    const plugin = CheckerPlugin({
      typescript: true,
    })

    sandbox.plugin = plugin
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })

    expect(cp.spawn).toHaveBeenCalledTimes(1)
    expect(cp.spawn).toHaveBeenCalledWith('tsc', ['--noEmit'], spawnOptions)
  })

  it('vueTsc', () => {
    const plugin = CheckerPlugin({
      vueTsc: true,
    })

    sandbox.plugin = plugin
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })

    expect(cp.spawn).toHaveBeenCalledTimes(1)
    expect(cp.spawn).toHaveBeenCalledWith('vue-tsc', ['--noEmit'], spawnOptions)
  })

  it('custom checker (test vls)', () => {
    const plugin = CheckerPlugin({
      vls: VlsChecker(),
    })

    sandbox.plugin = plugin
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })

    expect(cp.spawn).toHaveBeenCalledTimes(1)
    expect(cp.spawn).toHaveBeenCalledWith('vite-plugin-checker-vls', ['diagnostics'], spawnOptions)
  })

  it('multiple checkers', () => {
    const plugin = CheckerPlugin({
      typescript: true,
      vueTsc: true,
      vls: VlsChecker(),
    })

    sandbox.plugin = plugin
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })

    expect(cp.spawn).toHaveBeenCalledTimes(3)
    expect(cp.spawn).toHaveBeenNthCalledWith(1, 'tsc', ['--noEmit'], spawnOptions)
    expect(cp.spawn).toHaveBeenNthCalledWith(2, 'vue-tsc', ['--noEmit'], spawnOptions)
    expect(cp.spawn).toHaveBeenNthCalledWith(
      3,
      'vite-plugin-checker-vls',
      ['diagnostics'],
      spawnOptions
    )
  })
})
