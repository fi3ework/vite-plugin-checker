import execa from 'execa'
import path from 'path'
import playwright from 'playwright-chromium'
import strip from 'strip-ansi'
import invariant from 'tiny-invariant'
import { build, createServer, HMRPayload, ViteDevServer } from 'vite'
import { Checker } from 'vite-plugin-checker'

import { expectStdoutNotContains, sleep, testDir } from '../testUtils'

import type { ElementHandleForTag } from 'playwright-chromium/types/structs'
let devServer: ViteDevServer
let binPath: string
export let log = ''
export let stripedLog = ''

export function proxyConsoleInTest() {
  Checker.logger = [
    (...args: any[]) => {
      log = args[0].payload
      stripedLog = strip(args[0].payload)
    },
  ]
}

export async function sleepForServerReady(ratio = 1) {
  await sleep(process.env.CI ? 10000 * ratio : 5000 * ratio)
}

export async function sleepForEdit() {
  await sleep(process.env.CI ? 4000 : 2000)
}

export function resetReceivedLog() {
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
  wsSend,
  proxyConsole = proxyConsoleInTest,
  launchPage = false,
}: {
  cwd?: string
  port?: number
  path?: string
  wsSend?: (payload: HMRPayload) => void
  proxyConsole?: () => void
  launchPage?: boolean
} = {}) {
  await sleep(3000)
  if (proxyConsole) {
    proxyConsole()
  }

  devServer = await createServer({
    root: cwd,
  })
  await devServer.listen()

  if (wsSend) {
    devServer.ws.send = (payload) => {
      wsSend(payload)
    }
  }

  if (launchPage) {
    console.log('-- launching page --')
    await page.goto(`http://localhost:${port}${_path}`)
    console.log('-- page launched --')
    await page.waitForLoadState('domcontentloaded')
    console.log('-- page loaded --')
  }
}

export async function killServer() {
  if (devServer) {
    await devServer.close()
    console.log('-- dev server closed --')
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
