import os from 'node:os'

import { codeFrameColumns } from '@babel/code-frame'

import { supportsTerminalColors } from './colors.js'

interface Position {
  line: number
  column?: number | undefined
}

export interface SourceLocation {
  start: Position
  end?: Position | undefined
}

function toZeroBasedPosition({ line, column }: Position): Position {
  return { line, column: column ? column - 1 : undefined }
}

/**
 * Create a code frame from source code and location
 * @param source source code
 * @param location 1-based location to highlight
 */
export function createFrame(source: string, location: SourceLocation): string {
  const { start, end } = location
  const zeroBased = {
    start: toZeroBasedPosition(start),
    end: end && toZeroBasedPosition(end),
  } as Parameters<typeof codeFrameColumns>[1]
  return codeFrameColumns(source, zeroBased, {
    forceColor: supportsTerminalColors(),
  })
    .split('\n')
    .map((line) => `  ${line}`)
    .join(os.EOL)
}

export function tsLikeLocToBabelLoc(
  tsLoc: Record<
    'start' | 'end',
    { line: number; character: number } /** 0-based */
  >,
): SourceLocation {
  return {
    start: { line: tsLoc.start.line + 1, column: tsLoc.start.character + 1 },
    end: { line: tsLoc.end.line + 1, column: tsLoc.end.character + 1 },
  }
}

export function lineColLocToBabelLoc(d: {
  line: number
  column: number
  endLine?: number
  endColumn?: number
}): SourceLocation {
  return {
    start: { line: d.line, column: d.column },
    end: { line: d.endLine || 0, column: d.endColumn },
  }
}

/**
 * Convert a [startOffset, length] range into a Babel-compatible SourceLocation.
 * - Lines/columns are 1-based.
 * - Offsets and length are clamped to source bounds.
 * - Single-pass up to the end offset, minimal allocations.
 */
export function offsetRangeToBabelLocation(
  source: string,
  offset: number,
  length: number,
): SourceLocation {
  const defaultPos = { line: 1, column: 1 }

  if (!source || source.length === 0) {
    return { start: { ...defaultPos }, end: { ...defaultPos } }
  }

  const startIndex = offset
  const endIndex = offset + length

  let line = 1
  let column = 1

  let start: { line: number; column: number } | null = null

  for (let i = 0; i < endIndex; i++) {
    if (i === startIndex) {
      start = { line, column }
    }
    // '\n' charCode is 10
    if (source[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }

  start ??= { line, column }
  const end = { line, column }

  return { start, end }
}
