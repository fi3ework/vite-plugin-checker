import execa from 'execa'
import path from 'path'
import playwright, { chromium } from 'playwright-chromium'
import type { ElementHandleForTag } from 'playwright-chromium/types/structs'
import strip from 'strip-ansi'
import invariant from 'tiny-invariant'
// import fs from 'fs'
// import os from 'os'

// @ts-ignore
// const page = global.page!
// const DIR = path.join(os.tmpdir(), 'jest_playwright_global_setup')
import { expectStdoutNotContains, sleep, testDir } from '../testUtils'

let devServer: any
let browser: playwright.Browser
// const page: playwright.Page
let binPath: string

export let log = ''
export let stripedLog = ''

export function resetTerminalLog() {
  log = ''
  stripedLog = ''
}

export async function preTest() {
  try {
    binPath = path.resolve(testDir, 'node_modules/vite/bin/vite.js')
  } catch (e) {}
}

export async function viteServe({
  cwd = process.cwd(),
  port = 3000,
  path: _path = '',
}: { cwd?: string; port?: number; path?: string } = {}) {
  sleep(2000)
  // @ts-ignore
  // const devServer = global.devServer!
  // browser = await chromium.launch({
  //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
  // })

  // const wsEndpoint = fs.readFileSync(path.join(DIR, 'wsEndpoint'), 'utf-8')
  // const browser = await chromium.connect({
  //   wsEndpoint,
  // })

  // // @ts-ignore
  // global.page = await browser.newPage()

  console.log('launching browser')
  // page = await browser.newPage()

  devServer = execa(binPath, {
    cwd: cwd ?? testDir,
  })

  await new Promise((resolve) => {
    devServer.stdout.on('data', (data: Buffer) => {
      log += data.toString()
      stripedLog += strip(data.toString())
      if (data.toString().match('running')) {
        console.log('dev server running.')
        resolve('')
      }
    })
  })

  await sleep(6000)
  await page.goto(`http://localhost:${port}${_path}`)
  await page.waitForLoadState('domcontentloaded')
  // await page.waitForSelector('body', { state: 'attached' })
}

export async function killServer() {
  // @ts-ignore
  // const devServer = global.devServer!
  // if (page) await page.close()
  if (devServer) {
    devServer.kill('SIGTERM', {
      forceKillAfterTimeout: 1,
    })
  }
}

export async function pollingUntil<T>(poll: () => Promise<T>, until: (actual: T) => boolean) {
  const maxTries = process.env.CI ? 1000 : 200 // 50s / 10s
  for (let tries = 0; tries <= maxTries; tries++) {
    const actual = await poll()
    if (until(actual)) {
      break
    } else {
      await sleep(50)
      if (tries === maxTries) {
        console.log('reach max polling tries')
      }
    }
  }
}

export async function waitForHmrOverlay() {
  const element = await page.waitForSelector('vite-error-overlay', { state: 'attached' })
  return element
}

export async function getHmrOverlay() {
  const dom = await page.$('vite-error-overlay')
  if (dom) console.log('found vite-error-overlay')
  return dom
}

export async function getHmrOverlayText(
  element?: ElementHandleForTag<'vite-error-overlay'> | null
) {
  let shadowRoot: ElementHandleForTag<'vite-error-overlay'> | undefined | null
  if (element) {
    shadowRoot = element
  } else {
    shadowRoot = await getHmrOverlay()
    invariant(
      shadowRoot,
      `<vite-error-overlay> shadow dom is expected to be found, but got ${shadowRoot}`
    )
  }

  if (!shadowRoot) {
    throw Error(`shadowRoot should exists, but got ${shadowRoot}`)
  }

  const messageBody = await shadowRoot.$('.message-body')
  invariant(messageBody, '.message-body is expected in shadow root')
  const message = await messageBody.innerText()

  const fileDom = await shadowRoot.$('.file-link')
  invariant(fileDom, '.file-link is expected in shadow root')
  const file = await fileDom.innerText()

  const frameDom = await shadowRoot.$('.frame')
  invariant(frameDom, '.frame is expected in shadow root')
  const frame = await frameDom.innerText()

  return [message, file, frame]
}

export async function viteBuild({
  unexpectedErrorMsg,
  expectedErrorMsg,
  cwd = process.cwd(),
}: {
  unexpectedErrorMsg?: string | string[]
  expectedErrorMsg?: string
  cwd?: string
} = {}) {
  const promise = execa(binPath, ['build'], {
    cwd: cwd ?? testDir,
  })

  if (expectedErrorMsg) {
    await expect(promise).rejects.toThrow(expectedErrorMsg)
    return
  }

  await expect(promise).resolves.toBeDefined()

  if (unexpectedErrorMsg) {
    expectStdoutNotContains((await promise).stdout, unexpectedErrorMsg)
  }
}

export function postTest() {}

export function declareTests(isBuild: boolean) {
  it('dummy', () => {
    expect(1).toBe(1)
  })
}
