import execa from 'execa'
import path from 'path'
import playwright, { chromium } from 'playwright-chromium'
import { ElementHandleForTag } from 'playwright-chromium/types/structs'
import strip from 'strip-ansi'
import invariant from 'tiny-invariant'

import { expectStdoutNotContains, sleep, testDir } from '../testUtils'

let devServer: any
let browser: playwright.Browser
let page: playwright.Page
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
  path = '',
}: { cwd?: string; port?: number; path?: string } = {}) {
  devServer = execa(binPath, {
    cwd: cwd ?? testDir,
  })

  browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

  console.log('launching browser')
  page = await browser.newPage()
  await page.goto(`http://localhost:${port}${path}`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('body', { state: 'visible' })
}

export async function killServer() {
  if (browser) await browser.close()
  if (devServer) {
    devServer.kill('SIGTERM', {
      forceKillAfterTimeout: 2000,
    })
  }
}

export async function pollingUntil<T>(poll: () => Promise<T>, until: (actual: T) => boolean) {
  const maxTries = process.env.CI ? 1000 : 100 // 50s / 5s
  for (let tries = 0; tries < maxTries; tries++) {
    const actual = await poll()
    if (until(actual)) {
      break
    } else {
      await sleep(50)
    }
  }
}

export async function getHmrOverlay() {
  return page.$('vite-error-overlay')
}

export async function getHmrOverlayText() {
  const shadowRoot = await getHmrOverlay()
  invariant(
    shadowRoot,
    `<vite-error-overlay> shadow dom is expected to be found, but got ${shadowRoot}`
  )

  const messageBody = await shadowRoot.$('.message-body')
  invariant(messageBody, '.message-body is expected in shadow root')
  const message = await messageBody.innerText()

  const fileLink = await shadowRoot.$('.file-link')
  invariant(fileLink, '.file-link is expected in shadow root')
  const file = await fileLink.innerText()

  return [message, file]
}

export async function viteBuild({
  unexpectedErrorMsg,
  expectedErrorMsg,
  cwd = process.cwd(),
}: { unexpectedErrorMsg?: string; expectedErrorMsg?: string; cwd?: string } = {}) {
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
