import os from 'os'
import ts from 'typescript'

import { codeFrameColumns } from '@babel/code-frame'

export function createFrame({
  source,
  start,
  end,
}: {
  source: string // file source code
  start: ts.LineAndCharacter
  end: ts.LineAndCharacter
}) {
  const frame = codeFrameColumns(
    source,
    {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    },
    {
      highlightCode: true,
    }
  )
    .split('\n')
    .map((line) => '  ' + line)
    .join(os.EOL)

  return frame
}
