import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Frame, type Page } from 'playwright-chromium'
import { createServer, type ViteDevServer } from 'vite'

const fixture = fileURLToPath(
  new URL('../playground/docs-screenshot/', import.meta.url),
)
const outDir = fileURLToPath(
  new URL('../docs/public/screenshots/', import.meta.url),
)

interface Shot {
  name: string
  /** Vite config file in the fixture */
  config?: string
  path: string
  viewport: { width: number; height: number }
  fullPage?: boolean
  ready(page: Page): Promise<void>
}

async function checkersIdle(page: Page | Frame) {
  await page.locator('.groups').waitFor()
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.checkers .pill').length > 0 &&
      document.querySelectorAll('.checkers .spinner').length === 0,
  )
}

async function frameOf(page: Page, selector: string) {
  const frame = await (await page
    .locator(selector)
    .elementHandle())!.contentFrame()
  return frame!
}

const shots: Shot[] = [
  {
    name: 'diagnostics-page',
    path: '__checker/',
    viewport: { width: 1000, height: 600 },
    fullPage: true,
    ready: checkersIdle,
  },
  {
    name: 'overlay-drawer',
    path: '',
    viewport: { width: 1000, height: 640 },
    async ready(page) {
      await checkersIdle(
        await frameOf(
          page,
          'vite-plugin-checker-overlay .drawer:not([hidden]) iframe',
        ),
      )
    },
  },
  {
    name: 'devtools-panel',
    config: 'vite.devtools.config.js',
    path: '',
    viewport: { width: 1000, height: 640 },
    async ready(page) {
      await page.locator('vite-plugin-checker-overlay .close').click()
      const dock = page.locator('devframes-dock-embedded')
      const entry = dock.locator('button[aria-label="Checker"]')
      await entry.waitFor({ state: 'attached' })
      await dock.locator('#devframes-dock').hover()
      await entry.click()
      await checkersIdle(
        await frameOf(
          page,
          'devframes-dock-embedded iframe[src*="__checker/"]',
        ),
      )
    },
  },
]

function checkersSettled(server: ViteDevServer) {
  const { api } = server.config.plugins.find(
    (plugin) => plugin.name === 'vite-plugin-checker',
  ) as unknown as {
    api: {
      getState(): { status: string }[]
      subscribe(listener: () => void): () => void
    }
  }
  const settled = () =>
    api.getState().every((c) => c.status === 'idle' || c.status === 'failed')
  return new Promise<void>((resolve) => {
    if (settled()) return resolve()
    const unsubscribe = api.subscribe(() => {
      if (!settled()) return
      unsubscribe()
      resolve()
    })
  })
}

const servers = new Map<string, Promise<ViteDevServer>>()
function serve(config = 'vite.config.js') {
  let server = servers.get(config)
  if (!server) {
    server = createServer({
      root: fixture,
      configFile: path.join(fixture, config),
      logLevel: 'warn',
      clearScreen: false,
      server: { host: '127.0.0.1', port: 0 },
    })
      .then((s) => s.listen())
      .then(async (s) => {
        await checkersSettled(s)
        return s
      })
    servers.set(config, server)
  }
  return server
}

const browser = await chromium.launch()
await mkdir(outDir, { recursive: true })

try {
  for (const shot of shots) {
    const base = (await serve(shot.config)).resolvedUrls!.local[0]!
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
        fullPage: shot.fullPage ?? false,
        animations: 'disabled',
        caret: 'hide',
      })
      console.log(path.relative(process.cwd(), file))
      await page.close()
    }
  }
} finally {
  await browser.close()
  for (const server of servers.values()) await (await server).close()
}
