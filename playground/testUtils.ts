import fs from 'fs'
import path from 'path'
import invariant from 'tiny-invariant'
import { expect } from 'vitest'

import { getDiagnosticsEmitCount, page, testDir } from './vitestSetup'

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

export function expectStderrContains(str: string | string[], expectedErrorMsg: string | string[]) {
  const strArr = Array.isArray(str) ? str : [str]
  const errorMsgArr = Array.isArray(expectedErrorMsg) ? expectedErrorMsg : [expectedErrorMsg]
  errorMsgArr.forEach((msg) => {
    const found = strArr.some((str) => str.includes(msg))
    expect(found).toBe(true)
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

export interface WaitForDiagnosticsOptions {
  /**
   * Number of independent checkers the playground configures (e.g. `typescript: true` + ESLint = 2).
   * The wait resolves once that many new emits have been observed since the call.
   * Each checker emits exactly once per file change (see `dispatchDiagnostics` in
   * the ESLint/TypeScript checker sources), including when its result set is empty.
   * Default 1.
   */
  checkers?: number
  /** Stop waiting after this many ms even if the expected emits haven't arrived. Default 30s on CI, 10s locally. */
  timeout?: number
  /**
   * After the expected emits have arrived, wait this long without another
   * emit before resolving. Guards against a checker emitting twice in quick
   * succession (the second emit would change the diagnostics array under us).
   * Default 500ms.
   */
  quietMs?: number
}

/**
 * Wait for the diagnostics ws stream to settle after an `editFile` call.
 *
 * Replaces the `await sleepForEdit()` pattern that was racing against slow
 * lint round-trips on CI. We poll the emit counter exposed by
 * `vitestSetup.ts` instead of sleeping for a fixed time, so the wait scales
 * with how long the checker actually takes.
 *
 * The baseline is captured at call time, so tests do not have to
 * `resetDiagnostics()` before `editFile()`; we just need `checkers` new emits
 * relative to the baseline, followed by `quietMs` of silence.
 */
export async function waitForDiagnostics(options: WaitForDiagnosticsOptions = {}): Promise<void> {
  const { timeout = process.env.CI ? 30_000 : 10_000, quietMs = 500, checkers = 1 } = options

  const baseline = getDiagnosticsEmitCount()
  const start = Date.now()
  let lastEmitCount = baseline
  let lastChangeAt = Date.now()

  while (Date.now() - start < timeout) {
    await sleep(50)
    const current = getDiagnosticsEmitCount()
    if (current !== lastEmitCount) {
      lastEmitCount = current
      lastChangeAt = Date.now()
      continue
    }
    if (current - baseline >= checkers && Date.now() - lastChangeAt >= quietMs) {
      return
    }
  }

  console.log(
    `waitForDiagnostics timed out after ${timeout}ms; expected ${checkers} new emit(s), got ${getDiagnosticsEmitCount() - baseline}`
  )
}

export interface WaitForNoOverlayOptions {
  /** Stop waiting after this many ms even if the overlay still shows a message. Default 20s on CI, 8s locally. */
  timeout?: number
  /** Once the overlay clears, require it to stay clear this long before resolving. Default 500ms. */
  quietMs?: number
}

/**
 * Wait until `<vite-plugin-checker-error-overlay>` reports no diagnostics and
 * stays empty for `quietMs`. Replaces the `await sleep(6000)` +
 * `rejects.toThrow(...)` pattern, which was racing two back-to-back edits
 * whose lint cycles hadn't both completed within the fixed sleep.
 *
 * The overlay custom element stays in the DOM for the lifetime of the page
 * (see `packages/runtime/src/main.ts`); when there are no diagnostics, its
 * inner `<template v-if="shouldRender">` is not rendered, so we detect a
 * dismissed overlay by the absence of `.message-body` inside its shadow root.
 */
export async function waitForNoOverlay(options: WaitForNoOverlayOptions = {}): Promise<void> {
  const { timeout = process.env.CI ? 20_000 : 8_000, quietMs = 500 } = options

  const start = Date.now()
  let goneSince: number | null = null

  while (Date.now() - start < timeout) {
    const dom = await page.$('vite-plugin-checker-error-overlay')
    const messageBody = dom ? await dom.$('.message-body') : null
    if (messageBody) {
      goneSince = null
    } else if (goneSince === null) {
      goneSince = Date.now()
    } else if (Date.now() - goneSince >= quietMs) {
      return
    }
    await sleep(50)
  }

  throw new Error(
    `waitForNoOverlay timed out after ${timeout}ms; overlay still reporting diagnostics`
  )
}
