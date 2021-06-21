import path from 'path'
import execa from 'execa'
import playwright, { chromium } from 'playwright-chromium'

let devServer: any
let browser: playwright.Browser
let page: playwright.Page
let binPath: string

const tempDir = composeTestTempDirPath()

export async function preTest() {
  try {
    binPath = path.resolve(tempDir, 'node_modules/vite/bin/vite.js')
  } catch (e) {}
}

export async function viteBuild({
  expectErrorMsg,
  cwd = process.cwd(),
}: { expectErrorMsg?: string; cwd?: string } = {}) {
  console.log('Vite building...')

  const expectError = typeof expectErrorMsg === 'string'

  if (!expectError) {
    await expect(
      execa(binPath, ['build'], {
        cwd: tempDir,
      })
    ).resolves.toBeDefined()
  } else {
    await expect(
      execa(binPath, ['build'], {
        cwd: cwd ?? tempDir,
      })
    ).rejects.toThrow(expectErrorMsg)
  }
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function composeTestTempDirPath() {
  const testPath = expect.getState().testPath
  const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1]
  return path.resolve(process.env.JEST_ROOT_DIR!, `./temp/${testName}`)
}

export async function postTest() {
  try {
    // await fs.remove(tempDir)
  } catch (e) {}
}

export async function startServer(isBuild: boolean) {
  // start dev server
  devServer = execa(binPath, {
    cwd: isBuild ? path.join(tempDir, '/dist') : tempDir,
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
