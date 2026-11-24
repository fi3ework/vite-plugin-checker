import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { runCommand } from '../src/checkers/_shared/runCommand'

const PAYLOAD_LENGTH = 1024 * 1024

const holdStdoutOpenScript = `
const holder = require('node:child_process').spawn(
  process.execPath,
  ['-e', 'setTimeout(() => {}, 10000)'],
  { stdio: ['ignore', 'inherit', 'ignore'] },
)
holder.unref()
process.stdout.write(holder.pid + '\\n' + 'x'.repeat(${PAYLOAD_LENGTH}))
`

function isRunning(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

describe('runCommand', () => {
  it('resolves with the stdout of the command', async () => {
    const stdout = await runCommand(
      [process.execPath, '-e', 'console.log("out"); console.error("err")'],
      process.cwd(),
    )
    expect(stdout.trim()).toBe('out')
  })

  it('resolves with the stdout of a failing command', async () => {
    const stdout = await runCommand(
      [process.execPath, '-e', 'console.log("out"); process.exitCode = 1'],
      process.cwd(),
    )
    expect(stdout.trim()).toBe('out')
  })

  it('rejects when the command cannot be spawned', async () => {
    await expect(
      runCommand([process.execPath], path.join(os.tmpdir(), 'does-not-exist')),
    ).rejects.toThrow('ENOENT')
  })

  it('resolves with the full stdout while another process holds the pipe open', async () => {
    const stdout = await runCommand(
      [process.execPath, '-e', holdStdoutOpenScript],
      process.cwd(),
    )
    const [pid, payload] = stdout.split('\n')
    const holderPid = Number(pid)
    const holderIsRunning = isRunning(holderPid)
    if (holderIsRunning) process.kill(holderPid)

    expect(holderIsRunning).toBe(true)
    expect(payload).toHaveLength(PAYLOAD_LENGTH)
  })
})
