import fs from 'fs'
import path from 'path'
import assert from 'assert'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const testPath = expect.getState().testPath
export const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
assert(testName, `should detect testName, but got null`)
export const testDir = path.resolve(process.env.JEST_ROOT_DIR!, `./temp/${testName}`)

export function editFile(
  filename: string,
  replacer: (str: string) => string
  // runInBuild: boolean = false
): void {
  // if (isBuild && !runInBuild) return
  const filePath = path.resolve(testDir, filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  const modified = replacer(content)
  fs.writeFileSync(filePath, modified)
}

export function expectStdoutNotContains(str: string, unexpectedErrorMsg: string) {
  expect.objectContaining({
    stdout: expect(str).not.toContain(unexpectedErrorMsg),
  })
}
