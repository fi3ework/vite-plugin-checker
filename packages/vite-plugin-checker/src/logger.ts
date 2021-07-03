import type { WriteStream } from 'tty'
import ansiEscapes from 'ansi-escapes'
// import cliCursor from 'cli-cursor'
// import wrapAnsi from 'wrap-ansi'
import sliceAnsi from 'slice-ansi'

const defaultTerminalHeight = 24

const getWidth = (stream: WriteStream, forceColumns?: number, fallbackColumns?: number) => {
  const { columns } = stream

  if (typeof forceColumns === 'number') return forceColumns

  if (!columns) {
    return fallbackColumns
  }

  return columns
}

const fitToTerminalHeight = (stream: WriteStream, text: string) => {
  const terminalHeight = stream.rows || defaultTerminalHeight
  const lines = text.split('\n')

  const toRemove = lines.length - terminalHeight
  if (toRemove <= 0) {
    return text
  }

  return sliceAnsi(text, lines.slice(0, toRemove).join('\n').length + 1, text.length)
}

const main = (
  stream: WriteStream,
  { forceColumns, fallbackColumns }: { forceColumns?: number; fallbackColumns?: number } = {}
) => {
  let previousLineCount = 0
  let previousWidth = getWidth(stream, forceColumns, fallbackColumns)
  let previousOutput = ''

  const render = (...args: any[]) => {
    // if (!showCursor) {
    //   cliCursor.hide()
    // }

    let output = args.join(' ') + '\n'
    output = fitToTerminalHeight(stream, output)
    const width = getWidth(stream)
    if (output === previousOutput && previousWidth === width) {
      return
    }

    previousOutput = output
    previousWidth = width
    // output = wrapAnsi(output, width, {
    //   trim: false,
    //   hard: true,
    //   wordWrap: false,
    // })

    // stream.write(ansiEscapes.eraseLines(previousLineCount + 1) + output)
    // stream.write(output)
    // previousLineCount = output.split('\n').length
    // if (!output.endsWith('\n')) {
    // previousLineCount += 1
    // }
    console.log(output)
  }

  render.clear = () => {
    stream.write(ansiEscapes.eraseLines(previousLineCount))
    previousOutput = ''
    previousWidth = getWidth(stream)
    previousLineCount = 0
  }

  render.done = () => {
    previousOutput = ''
    previousWidth = getWidth(stream)
    previousLineCount = 0

    // if (!showCursor) {
    //   cliCursor.show()
    // }
  }

  return render
}

export const logUpdate = main(process.stdout)
export const stderr = main(process.stderr)
export const create = main
