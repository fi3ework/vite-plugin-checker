import { codeFrameColumns } from '@babel/code-frame'

const rawLines = `class Foo {
  constructor() {
    console.log("hello");
  }
}`
const location = { start: { line: 2, column: 17 }, end: { line: 4, column: 3 } }

const result = codeFrameColumns(rawLines, location, {
  /* options */
})

console.log(result)
