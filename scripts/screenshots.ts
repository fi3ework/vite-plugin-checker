import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright-chromium'
import { createServer } from 'vite'

const fixture = fileURLToPath(
  new URL('../playground/docs-screenshot/', import.meta.url),
)
const outDir = fileURLToPath(
  new URL('../docs/public/screenshots/', import.meta.url),
)

interface Shot {
  name: string
  path: string
  viewport: { width: number; height: number }
  ready(page: Page): Promise<void>
}

async function checkersIdle(page: Page) {
  await page.locator('.groups').waitFor()
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.checkers .pill').length > 0 &&
      document.querySelectorAll('.checkers .spinner').length === 0,
  )
}

const shots: Shot[] = [
  {
    name: 'diagnostics-page',
    path: '__checker/',
    viewport: { width: 1000, height: 600 },
    ready: checkersIdle,
  },
]

const server = await createServer({
  root: fixture,
  configFile: path.join(fixture, 'vite.config.js'),
  logLevel: 'warn',
  clearScreen: false,
  server: { host: '127.0.0.1', port: 0 },
})
await server.listen()
const base = server.resolvedUrls!.local[0]!

const browser = await chromium.launch()
await mkdir(outDir, { recursive: true })

try {
  for (const shot of shots) {
    for (const colorScheme of ['dark', 'light'] as const) {
      const page = await browser.newPage({
        viewport: shot.viewport,
        deviceScaleFactor: 2,
        colorScheme,
        reducedMotion: 'reduce',
      })
      await page.goto(new URL(shot.path, base).href)
      await shot.ready(page)
      await page.evaluate(() => document.fonts.ready)
      const file = path.join(outDir, `${shot.name}-${colorScheme}.png`)
      await page.screenshot({
        path: file,
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      })
      console.log(path.relative(process.cwd(), file))
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
