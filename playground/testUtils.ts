import fs from 'fs'
import path from 'path'
import { expect } from 'vitest'

import { checkerApi, diagnostics, getDiagnosticsEmitCount, page, testDir } from './vitestSetup'

import type { ElementHandle, Frame, FrameLocator } from 'playwright-chromium'
import type { Diagnostic } from '../packages/vite-plugin-checker/src/protocol'

export const OVERLAY = 'vite-plugin-checker-overlay'
const OPEN_DRAWER_FRAME = `${OVERLAY} .drawer:not([hidden]) iframe`

export * from './vitestSetup'

export function editFile(
  filename: string,
  replacer: (str: string) => string,
  { atomic = false } = {},
): void {
  const filePath = path.resolve(testDir, filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  const modified = replacer(content)
  if (atomic) {
    const tempPath = `${filePath}.${process.pid}.tmp`
    fs.writeFileSync(tempPath, modified)
    fs.renameSync(tempPath, filePath)
  } else {
    fs.writeFileSync(filePath, modified)
  }
}

export function editFileTo(filename: string, content: string): void {
  const filePath = path.resolve(testDir, filename)
  fs.writeFileSync(filePath, content)
}

export function removeFile(filename: string): void {
  fs.rmSync(path.resolve(testDir, filename))
}

export function hasDiagnosticFor(filename: string): boolean {
  return diagnostics.some((d) => d.file?.replace(/\\/g, '/').endsWith(filename))
}

export function expectStderrContains(str: string | string[], expectedErrorMsg: string | string[]) {
  const strArr = Array.isArray(str) ? str : [str]
  const errorMsgArr = Array.isArray(expectedErrorMsg) ? expectedErrorMsg : [expectedErrorMsg]
  errorMsgArr.forEach((msg) => {
    const found = strArr.some((str) => str.includes(msg))
    expect(found).toBe(true)
  })
}

function sleep(millisecond: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, millisecond))
}

/**
 * Wait until every checker has finished its first run, then a little longer
 * for the page and the terminal log to catch up.
 */
export async function waitForServerReady() {
  const timeout = process.env.CI ? 60_000 : 30_000
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const states = checkerApi.getState()
    if (states.length && states.every((s) => s.status === 'idle' || s.status === 'failed')) {
      await sleep(process.env.CI ? 1_000 : 500)
      return
    }
    await sleep(50)
  }
  console.log(`waitForServerReady timed out after ${timeout}ms`)
}

export async function getHmrOverlay(): Promise<ElementHandle | null> {
  return page.$(OVERLAY)
}

export function getOverlayBadge() {
  return page.locator(`${OVERLAY} .badge`)
}

/** Diagnostics page inside the open drawer, waiting for the drawer to open */
export function getOverlayPage(): FrameLocator {
  return page.frameLocator(OPEN_DRAWER_FRAME)
}

/** Diagnostics page inside the open drawer, or `null` when no drawer is open */
export async function getOverlayFrame(): Promise<Frame | null> {
  const iframe = await page.$(OPEN_DRAWER_FRAME)
  return (await iframe?.contentFrame()) ?? null
}

/**
 * Message, `file:line:column` and snippet of the first diagnostic in the open
 * drawer. Snippet rows are rendered as `> 3 | code`, with the marked range in
 * `«»`.
 */
export async function getHmrOverlayText(): Promise<[string, string, string]> {
  const item = getOverlayPage().locator('.diagnostic').first()
  await item.waitFor({ timeout: process.env.CI ? 20_000 : 10_000 })

  return item.evaluate((el) => {
    const title = el.closest('.group')!.querySelector('.title')!.textContent!.trim()
    const location = el.querySelector('.location')?.textContent?.trim()
    const message = el.querySelector('.message')!.textContent!
    const rows = [...el.querySelectorAll('.snippet .row')].map((row) => {
      const number = row.querySelector('.number')!.textContent!
      const text = [...row.querySelector('.text')!.childNodes]
        .map((node) => (node.nodeName === 'MARK' ? `«${node.textContent}»` : node.textContent))
        .join('')
      const marker = row.classList.contains('active') ? '>' : ' '
      return `${marker} ${number.padStart(3)} | ${text}`.trimEnd()
    })
    return [message, location ? `${title}:${location}` : title, rows.join('\n')]
  })
}

export interface WaitForDiagnosticsOptions {
  /** Stop waiting after this many ms even if no new emit was observed. Default 30s on CI, 10s locally. */
  timeout?: number
  /**
   * After the most recent emit (or the call, if there have been no emits
   * yet), wait this long without another emit before resolving. Default 2s.
   *
   * Sized to absorb the gap between two checkers reporting after the same
   * edit (e.g. ESLint quickly, TypeScript a moment later in `multiple-hmr`)
   * on slow CI runners.
   */
  quietMs?: number
  /**
   * Require at least this many emits after the call before the quiet window
   * can resolve. Default 1, so a slow checker that has not yet re-linted the
   * edit cannot let the quiet window elapse on stale diagnostics.
   */
  minEmits?: number
  /** Also require the current diagnostics to satisfy this before resolving. */
  until?: (diagnostics: Diagnostic[]) => boolean
}

/**
 * Wait for the diagnostics ws stream to settle after an `editFile` call.
 *
 * Polls the emit counter exposed by `vitestSetup.ts`, so the wait scales
 * with how long the checker actually takes.
 *
 * The baseline is captured at call time, so tests do not need to
 * `resetDiagnostics()` before `editFile()`; we resolve once at least
 * `minEmits` emits have arrived since the call and `quietMs` have passed
 * without another emit. Requiring an emit stops a slow checker, which has not
 * yet re-linted the edit, from settling on the pre-edit diagnostics.
 */
export async function waitForDiagnostics(options: WaitForDiagnosticsOptions = {}): Promise<void> {
  const {
    timeout = process.env.CI ? 30_000 : 10_000,
    quietMs = 2_000,
    minEmits = 1,
    until = () => true,
  } = options

  const start = Date.now()
  const baseline = getDiagnosticsEmitCount()
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
    if (
      current - baseline >= minEmits &&
      Date.now() - lastChangeAt >= quietMs &&
      until(diagnostics)
    ) {
      return
    }
  }

  console.log(`waitForDiagnostics timed out after ${timeout}ms`)
}

export interface WaitForNoOverlayOptions {
  /** Stop waiting after this many ms even if the overlay still shows a message. Default 20s on CI, 8s locally. */
  timeout?: number
  /** Once the overlay clears, require it to stay clear this long before resolving. Default 500ms. */
  quietMs?: number
}

/**
 * Wait until neither the badge nor the drawer of
 * `<vite-plugin-checker-overlay>` is shown, and they stay hidden for
 * `quietMs`.
 */
export async function waitForNoOverlay(options: WaitForNoOverlayOptions = {}): Promise<void> {
  const { timeout = process.env.CI ? 20_000 : 8_000, quietMs = 500 } = options
  const shown = page.locator(`${OVERLAY} .badge:not([hidden]), ${OVERLAY} .drawer:not([hidden])`)

  const start = Date.now()
  let goneSince: number | null = null

  while (Date.now() - start < timeout) {
    // a page mid-reload counts as shown until the overlay mounts again
    const visible = await shown.count().catch(() => 1)
    if (visible) {
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
