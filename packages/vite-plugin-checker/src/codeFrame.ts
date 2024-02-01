import os from 'node:os'
import type ts from 'typescript'

import { codeFrameColumns, type SourceLocation } from '@babel/code-frame'

export function createFrame({
  source,
  location,
}: {
  source: string // file source code
  location: SourceLocation
}) {
  const frame = codeFrameColumns(source, location, {
    highlightCode: true,
  })
    .split('\n')
    .map((line) => '  ' + line)
    .join(os.EOL)

  return frame
}

export function tsLocationToBabelLocation(
  tsLoc: Record<'start' | 'end', ts.LineAndCharacter /** 0-based */>
): SourceLocation {
  return {
    start: { line: tsLoc.start.line + 1, column: tsLoc.start.character + 1 },
    end: { line: tsLoc.end.line + 1, column: tsLoc.end.character + 1 },
  }
}
