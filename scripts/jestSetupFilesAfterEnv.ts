import execa from 'execa'
import fs from 'fs-extra'
import * as http from 'http'
import path, { dirname, resolve } from 'path'
import { Page } from 'playwright-chromium'
import { build, createServer, PluginOption, ResolvedConfig, UserConfig, ViteDevServer } from 'vite'

const isBuildTest = !!process.env.VITE_TEST_BUILD

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

let tempDir: string
let err: Error
let devServer: any

// injected by the test env
declare global {
  namespace NodeJS {
    interface Global {
      page?: Page
      viteTestUrl?: string
    }
  }
}

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

beforeAll(async () => {
  const page = global.page
  if (!page) {
    return
  }

  try {
    const testPath = expect.getState().testPath
    const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
    if (testName) {
      await copyCode({ includeNodeModules: true, cleanBefore: true })
      // const testDir = path.resolve(process.env.JEST_ROOT_DIR!, `./temp/${testName}`)
      // const binPath = path.resolve(testDir, 'node_modules/vite/bin/vite.js')
      // devServer = execa(binPath, {
      //   cwd: testDir,
      // })

      // @ts-ignore
      // global.devServer = devServer

      // await new Promise((resolve) => {
      //   devServer.stdout.on('data', (data: Buffer) => {
      //     log += data.toString()
      //     stripedLog += strip(data.toString())
      //     if (data.toString().match('running')) {
      //       console.log('dev server running.')
      //       resolve('')
      //     }
      //   })
      // })

      // await page.goto(`http://localhost:${3000}${''}`)
      // await page.waitForLoadState('domcontentloaded')
      // await page.waitForSelector('body', { state: 'visible' })
    }
  } catch (e: any) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    err = e

    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
  }
}, 30000)

afterAll(async () => {
  // global.page?.off('console', onConsole)
  await global.page?.close()
  // await server?.close()
  // if (err) {
  // throw err
  // }
})
