import fs from 'fs'
import path from 'path'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const WORKER_CLEAN_TIMEOUT = process.env.CI ? 6000 : 3000
export const testPath = expect.getState().testPath
export const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
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

export function expectStdoutNotContains(str: string, unexpectedErrorMsg: string | string[]) {
  expect.objectContaining({
    stdout: expect(str).not.toContain(unexpectedErrorMsg),
  })
}

export async function sleep(millisecond: number, callback?: Function) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, millisecond)
  }).then(() => callback?.())
}
