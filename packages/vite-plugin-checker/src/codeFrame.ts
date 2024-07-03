import os from 'node:os'

import { codeFrameColumns, type SourceLocation } from '@babel/code-frame'

/**
 * Create a code frame from source code and location
 * @param source source code
 * @param location babel compatible location to highlight
 */
export function createFrame(source: string, location: SourceLocation): string {
  return codeFrameColumns(source, location, {
    // worker tty did not fork parent process stdout, let's make a workaround
    forceColor: true,
  })
    .split('\n')
    .map((line) => `  ${line}`)
    .join(os.EOL)
}

export function tsLocationToBabelLocation(
  tsLoc: Record<'start' | 'end', { line: number; character: number } /** 0-based */>
): SourceLocation {
  return {
    start: { line: tsLoc.start.line + 1, column: tsLoc.start.character + 1 },
    end: { line: tsLoc.end.line + 1, column: tsLoc.end.character + 1 },
  }
}

export function locationToBabelLocation(d: {
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
