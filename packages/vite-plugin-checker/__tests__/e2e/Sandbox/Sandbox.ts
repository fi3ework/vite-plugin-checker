import path from 'path'
import execa from 'execa'
import playwright, { chromium } from 'playwright-chromium'
import { slash, testPath, testName, testDir } from '../testUtils'

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
  console.log('Vite building...')

  const expectError = typeof expectedErrorMsg === 'string'

  if (!expectError) {
    await expect(
      execa(binPath, ['build'], {
        cwd: testDir,
      })
    ).resolves.toBeDefined()
  } else { 
    await expect(
      execa(binPath, ['build'], {
        cwd: cwd ?? testDir,
      })
    ).rejects.toThrow(expectedErrorMsg)
  }
}

export async function postTest() {
  try {
    // await fs.remove(tempDir)
  } catch (e) {}
}

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
