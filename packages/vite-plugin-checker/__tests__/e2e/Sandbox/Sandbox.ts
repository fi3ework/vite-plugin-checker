import path from 'path'
import execa from 'execa'
import playwright, { chromium } from 'playwright-chromium'

let devServer: any
let browser: playwright.Browser
let page: playwright.Page
let binPath: string

// const fixtureDir = path.join(__dirname, '../../../../../playground/react-ts')
const tempDir = path.join(__dirname, '../../../../../playground/react-ts')

export async function preTest() {
  try {
    // await fs.remove(tempDir)
  } catch (e) {}
  // await fs.copy(fixtureDir, tempDir, {
  //   filter: (file) => !/dist|node_modules/.test(file),
  // })
  // await execa('yarn', { cwd: tempDir })
  binPath = path.resolve(tempDir, './node_modules/vite/bin/vite.js')

  // await viteBuild()
}

export async function viteBuild(errorMsg?: string) {
  console.log('Vite building...')

  const expectError = typeof errorMsg === 'string'

  if (!expectError) {
    await expect(
      execa(binPath, ['build'], {
        cwd: tempDir,
      })
    ).resolves.toBeDefined()
  } else {
    await expect(
      execa(binPath, ['build'], {
        cwd: tempDir,
      })
    ).rejects.toThrow(errorMsg)
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
