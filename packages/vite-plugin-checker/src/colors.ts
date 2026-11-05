import { styleText } from 'node:util'

type Format = Parameters<typeof styleText>[0]

let terminalColors: boolean | undefined

/**
 * Whether terminal output is coloured. Detected from `process.stdout` unless
 * set from the main thread, as worker threads have no real TTY to detect
 * support from.
 */
export function supportsTerminalColors(): boolean {
  terminalColors ??= styleText('red', '-') !== '-'
  return terminalColors
}

export function setTerminalColors(enabled: boolean) {
  terminalColors = enabled
}

export function colorize(format: Format, text: string): string {
  return supportsTerminalColors()
    ? styleText(format, text, { validateStream: false })
    : text
}
