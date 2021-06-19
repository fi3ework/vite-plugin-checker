import cp from 'child_process'

import CheckerPlugin from '../../src/main'
import { Sandbox } from './Sandbox/Sandbox'

const { createServeAndBuild: TestChecker, buildBin } = require('./TestChecker/main.js')

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
  let sandbox!: Sandbox

  beforeAll(() => {
    sandbox = new Sandbox()
    const plugin = CheckerPlugin({
      // TODO: allow custom checker key
      vls: TestChecker(),
    })
    sandbox.plugin = plugin
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('run build bin by child_process.spawn', () => {
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })

    expect(cp.spawn).toHaveBeenCalledTimes(1)
    expect(cp.spawn).toHaveBeenCalledWith(buildBin[0], buildBin[1], expect.anything())
  })
})
