import fs from 'fs'
import path from 'path'
import invariant from 'tiny-invariant'
import { expect } from 'vitest'

import { page, testDir } from './vitestSetup'

import type { ElementHandle } from 'playwright-chromium'

export * from './vitestSetup'

export const WORKER_CLEAN_TIMEOUT = process.env.CI ? 6000 : 3000

export function editFile(filename: string, replacer: (str: string) => string): void {
  const filePath = path.resolve(testDir, filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  const modified = replacer(content)
  fs.writeFileSync(filePath, modified)
}

export function editFileTo(filename: string, content: string): void {
  const filePath = path.resolve(testDir, filename)
  fs.writeFileSync(filePath, content)
}

export function expectStderrContains(str: string, expectedErrorMsg: string | string[]) {
  const errorMsgArr = Array.isArray(expectedErrorMsg) ? expectedErrorMsg : [expectedErrorMsg]
  errorMsgArr.forEach((msg) => {
    expect(str).toContain(msg)
  })
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

export async function sleepForServerReady(ratio = 1) {
  await sleep(process.env.CI ? 10e3 * ratio : 8e3 * ratio)
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

export async function sleepForEdit(ratio = 1) {
  await sleep(process.env.CI ? 4e3 * ratio : 2e3 * ratio)
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
