import fs from 'fs-extra'
import * as http from 'http'
import { resolve, dirname } from 'path'
import { createServer, build, ViteDevServer, UserConfig, PluginOption, ResolvedConfig } from 'vite'
import { Page } from 'playwright-chromium'

const isBuildTest = !!process.env.VITE_TEST_BUILD

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

let tempDir: string

export async function copyCode({
  includeNodeModules = false,
  cleanBefore = false,
}: { includeNodeModules?: boolean; cleanBefore?: boolean } = {}) {
  try {
    const testPath = expect.getState().testPath
    const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      const playgroundRoot = resolve(__dirname, '../playground')
      const srcDir = resolve(playgroundRoot, testName)
      tempDir = resolve(__dirname, '../temp', testName)
      if (cleanBefore) {
        await fs.remove(tempDir)
      }
      await fs.copy(srcDir, tempDir, {
        overwrite: true,
        // dereference: true,
        filter(rawFile) {
          const file = slash(rawFile)
          const copyNodeModules = includeNodeModules ? true : !file.includes('node_modules')
          return (
            !file.includes('__tests__') &&
            // TODO: copy node_modules is not elegant
            // Maybe we should install dependencies after copy
            copyNodeModules &&
            !file.match(/dist(\/|$)/)
          )
        },
      })
    }
  } catch (e) {}
}

beforeAll(async () => copyCode({ includeNodeModules: true, cleanBefore: true }), 30000)

afterAll(async () => {
  // global.page?.off('console', onConsole)
  // await global.page?.close()
  // await server?.close()
  // if (err) {
  //   throw err
  // }
})
