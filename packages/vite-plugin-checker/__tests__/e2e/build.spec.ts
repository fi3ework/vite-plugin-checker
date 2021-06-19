import cp from 'child_process'

import CheckerPlugin from '../../src/main'
import { Sandbox } from './Sandbox/Sandbox'

const { createServeAndBuild: TestChecker, buildBin } = require('./TestChecker/main')

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
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('run build bin by child_process.spawn', () => {
    const plugin = CheckerPlugin({
      myChecker: TestChecker(),
    })

    sandbox.plugin = plugin
    sandbox.viteBuild({
      config: {},
      env: { command: 'build', mode: '' },
    })
    expect(cp.spawn).toHaveBeenCalledTimes(1)
    expect(cp.spawn).toHaveBeenCalledWith(buildBin[0], buildBin[1], expect.anything())
  })
})
