import { x } from 'tinyexec'

const DRAIN_INTERVAL_MS = 100

/**
 * Run a one-shot command and resolve with its stdout once the process has
 * exited. The stdout pipe is not required to reach EOF, because its write end
 * can be inherited by an unrelated long-lived process
 * (https://github.com/libuv/libuv/issues/1490).
 */
export function runCommand(argv: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = x(argv[0]!, argv.slice(1), {
      nodeOptions: { cwd, stdio: ['ignore', 'pipe', 'ignore'] },
    }).process!
    const stdout = child.stdout!
    let output = ''
    let timer: NodeJS.Timeout | undefined

    const finish = () => {
      clearTimeout(timer)
      stdout.destroy()
      resolve(output)
    }

    // An overdue timer runs before pending pipe reads, so the output length is
    // compared after one more poll phase.
    const finishWhenDrained = () => {
      const { length } = output
      timer = setTimeout(() => {
        setImmediate(() => {
          if (stdout.destroyed || output.length === length) finish()
          else finishWhenDrained()
        })
      }, DRAIN_INTERVAL_MS)
    }

    stdout.setEncoding('utf8')
    stdout.on('data', (chunk: string) => {
      output += chunk
    })
    child.once('error', reject)
    child.once('exit', finishWhenDrained)
    child.once('close', finish)
  })
}
