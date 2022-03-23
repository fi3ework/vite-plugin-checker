import execa from 'execa'
import path from 'path'
import strip from 'strip-ansi'
import invariant from 'tiny-invariant'
import { createServer, ViteDevServer, CustomPayload } from 'vite'
import { Checker } from 'vite-plugin-checker'

import { expectStdoutNotContains, expectStderrContains, sleep, testDir } from '../testUtils'

import type { ElementHandle } from 'playwright-chromium'
let devServer: ViteDevServer
let binPath: string
export let log = ''
export let stripedLog = ''

export function proxyConsoleInTest(accumulate = true) {
  Checker.logger = [
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

export async function sleepForServerReady(ratio = 1) {
  await sleep(process.env.CI ? 10e3 * ratio : 5e3 * ratio)
}

export async function sleepForEdit(ratio = 1) {
  await sleep(process.env.CI ? 4e3 * ratio : 2e3 * ratio)
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
  wsSend?: (payload: CustomPayload) => void
  proxyConsole?: () => void
  launchPage?: boolean
} = {}) {
  if (proxyConsole) {
    proxyConsole()
  }

  await sleep(3000)

  devServer = await createServer({
    root: cwd,
  })
  await devServer.listen()

  if (wsSend) {
    devServer.ws.send = (payload: CustomPayload) => {
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

export async function waitForHmrOverlay(): Promise<
  ElementHandle<'vite-plugin-checker-error-overlay'>
> {
  const element = await page.waitForSelector('vite-plugin-checker-error-overlay', {
    state: 'attached',
  })
  return element as any
}

export async function getHmrOverlay(): Promise<ElementHandle<'vite-plugin-checker-error-overlay'> | null> {
  const dom = await page.$('vite-plugin-checker-error-overlay')
  if (dom) console.log('found vite-plugin-checker-error-overlay')
  return dom as any
}

export async function getHmrOverlayText(
  element?: ElementHandle<'vite-plugin-checker-error-overlay'> | null
) {
  let shadowRoot: ElementHandle<'vite-plugin-checker-error-overlay'> | undefined | null
  if (element) {
    shadowRoot = element
  } else {
    shadowRoot = await getHmrOverlay()
    invariant(
      shadowRoot,
      `<vite-plugin-checker-error-overlay> shadow dom is expected to be found, but got ${shadowRoot}`
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
  expectedErrorMsg?: string | string[]
  cwd?: string
} = {}) {
  const promise = execa(binPath, ['build'], {
    cwd: cwd ?? testDir,
  })

  if (expectedErrorMsg) {
    try {
      await promise
      throw new Error('Fail! Should failed with error message')
    } catch (e) {
      expectStderrContains((e as any).toString(), expectedErrorMsg)
    }
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
