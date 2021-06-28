import path from 'path'
import execa from 'execa'
import playwright, { chromium } from 'playwright-chromium'
import { testDir, expectStdoutNotContains } from '../testUtils'

let devServer: any
let browser: playwright.Browser
let page: playwright.Page
let binPath: string

export async function preTest() {
  try {
    binPath = path.resolve(testDir, 'node_modules/vite/bin/vite.js')
  } catch (e) {}
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

export async function startServer(isBuild: boolean) {
  // start dev server
  devServer = execa(binPath, {
    cwd: isBuild ? path.join(testDir, '/dist') : testDir,
  })

  browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  await new Promise((resolve) => {
    devServer.stdout.on('data', (data: Buffer) => {
      if (data.toString().match('running')) {
        console.log('dev server running.')
        resolve('')
      }
    })
  })

  console.log('launching browser')
  page = await browser.newPage()
  await page.goto('http://localhost:3000')
}

export async function killServer() {
  if (browser) await browser.close()
  if (devServer) {
    devServer.kill('SIGTERM', {
      forceKillAfterTimeout: 2000,
    })
  }
}

export function declareTests(isBuild: boolean) {
  it('dummy', () => {
    expect(1).toBe(1)
  })
}
