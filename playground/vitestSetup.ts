import execa from 'execa'
import fs from 'fs-extra'
import * as http from 'node:http'
import os from 'node:os'
import path, { dirname, join, resolve } from 'node:path'
import { chromium } from 'playwright-chromium'
import strip from 'strip-ansi'
import { createServer, mergeConfig } from 'vite'
import { beforeAll, expect } from 'vitest'

import { serializers } from './serializers'

import type { Browser, Page } from 'playwright-chromium'
import type { InlineConfig, ResolvedConfig, ViteDevServer } from 'vite'
import type { File } from 'vitest'
import pathSerializer from 'jest-serializer-path'

expect.addSnapshotSerializer(pathSerializer)
expect.addSnapshotSerializer(serializers)

// #region env

export const workspaceRoot = resolve(__dirname, '../')

export const isBuild = !!process.env.VITE_TEST_BUILD
export const isServe = !isBuild
export const isWindows = process.platform === 'win32'
export const viteBinPath = path.posix.join(workspaceRoot, 'packages/vite/bin/vite.js')

// #region context

let server: ViteDevServer | http.Server

/**
 * Vite Dev Server when testing serve
 */
export let viteServer: ViteDevServer
/**
 * Root of the Vite fixture
 */
export let rootDir: string
/**
 * Path to the current test file
 */
export let testPath: string
/**
 * Path to the test folder
 */
export let testDir: string
/**
 * Test folder name
 */
export let testName: string
/**
 * current test using vite inline config
 * when using server.js is not possible to get the config
 */
export let viteConfig: InlineConfig | undefined

export let diagnostics: string[]
export let log = ''
export let stripedLog = ''
export let buildSucceed: boolean

export const serverLogs: string[] = []
export const browserLogs: string[] = []
export const browserErrors: Error[] = []

export let resolvedConfig: ResolvedConfig = undefined!

export let page: Page = undefined!
export let browser: Browser = undefined!
export let viteTestUrl = ''
// export let watcher: RollupWatcher | undefined = undefined

declare module 'vite' {
  interface InlineConfig {
    testConfig?: {
      // relative base output use relative path
      // rewrite the url to truth file path
      baseRoute: string
    }
  }
}

export function setViteUrl(url: string): void {
  viteTestUrl = url
}

// #endregion

const DIR = join(os.tmpdir(), 'vitest_playwright_global_setup')

export function proxyConsoleInTest(c: any, accumulate = true) {
  c.logger = [
    (...args: any[]) => {
      if (accumulate) {
        log += args[0].payload
        stripedLog += strip(args[0].payload)
      } else {
        log = args[0].payload
        stripedLog = strip(args[0].payload)
      }
    },
  ]
}

beforeAll(async (s) => {
  const suite = s as File
  // skip browser setup for non-playground tests
  if (!suite.filepath.includes('playground')) {
    return
  }

  const wsEndpoint = fs.readFileSync(join(DIR, 'wsEndpoint'), 'utf-8')
  if (!wsEndpoint) {
    throw new Error('wsEndpoint not found')
  }

  browser = await chromium.connect(wsEndpoint)
  page = await browser.newPage()

  const globalConsole = global.console
  const warn = globalConsole.warn
  globalConsole.warn = (msg, ...args) => {
    // suppress @vue/reactivity-transform warning
    if (msg.includes('@vue/reactivity-transform')) return
    if (msg.includes('Generated an empty chunk')) return
    warn.call(globalConsole, msg, ...args)
  }

  try {
    page.on('console', (msg) => {
      browserLogs.push(msg.text())
    })
    page.on('pageerror', (error) => {
      browserErrors.push(error)
    })

    testPath = suite.filepath!

    // @ts-ignore
    testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
    testDir = dirname(testPath)

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      testDir = resolve(workspaceRoot, 'playground-temp', testName)

      // when `root` dir is present, use it as vite's root
      const testCustomRoot = resolve(testDir, 'root')
      rootDir = fs.existsSync(testCustomRoot) ? testCustomRoot : testDir

      await startDefaultServe()
    }
  } catch (e) {
    // Closing the page since an error in the setup, for example a runtime error
    // when building the playground should skip further tests.
    // If the page remains open, a command like `await page.click(...)` produces
    // a timeout with an exception that hides the real error in the console.
    await page.close()
    await server?.close()
    throw e
  }

  return async () => {
    serverLogs.length = 0
    await page?.close()
    await server?.close()
    // watcher?.close()
    if (browser) {
      await browser.close()
    }
  }
})

export async function startDefaultServe(): Promise<void> {
  const testCustomConfig = resolve(testDir, 'vite.config.js')

  let config: InlineConfig | undefined
  if (fs.existsSync(testCustomConfig)) {
    // test has custom server configuration.
    config = await import(testCustomConfig).then((r) => r.default)
  }

  const options: InlineConfig = {
    root: rootDir,
    // logLevel: 'silent',
    // server: {
    //   watch: {
    //     // During tests we edit the files too fast and sometimes chokidar
    //     // misses change events, so enforce polling for consistency
    //     usePolling: true,
    //     interval: 100,
    //   },
    //   host: true,
    //   fs: {
    //     strict: !isBuild,
    //   },
    // },
    // build: {
    //   // esbuild do not minify ES lib output since that would remove pure annotations and break tree-shaking
    //   // skip transpilation during tests to make it faster
    //   target: 'esnext',
    //   // tests are flaky when `emptyOutDir` is `true`
    //   emptyOutDir: false,
    // },
    // customLogger: createInMemoryLogger(serverLogs),
  }

  if (!isBuild) {
    process.env.VITE_INLINE = 'inline-serve'
    const testConfig = mergeConfig(options, config || {})
    viteConfig = testConfig
    // proxyConsoleInTest()

    const viteDevServer1 = await createServer({ root: rootDir })
    const checker = viteDevServer1.config.plugins.filter(
      ({ name }) => name === 'vite-plugin-checker'
    )[0]

    // @ts-ignore
    proxyConsoleInTest(checker.__checker)
    viteServer = server = await viteDevServer1.listen()

    // use resolved port/base from server
    const devBase = server.config.base
    viteTestUrl = `http://localhost:${server.config.server.port}${devBase === '/' ? '' : devBase}`

    const rawWsSend = server.ws.send
    server.ws.send = (_payload) => {
      if (_payload.type === 'custom' && _payload.event === 'vite-plugin-checker:error') {
        diagnostics = _payload.data.diagnostics
      }

      return rawWsSend(_payload)
    }

    await page.goto(viteTestUrl)
  } else {
    const testConfig = mergeConfig(options, config || {})
    const binPath = path.resolve(testDir, 'node_modules/vite/bin/vite.js')
    const promise = execa(binPath, ['build'], { cwd: testConfig.root })
    try {
      await promise
      buildSucceed = true
    } catch (e) {
      log = (e as any).toString()
      stripedLog += strip(log)
      buildSucceed = false
      // expectStderrContains((e as any).toString(), expectedErrorMsg)
    }
  }
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function resetReceivedLog() {
  log = ''
  stripedLog = ''
}

export function resetDiagnostics() {
  diagnostics = []
}
