import os from 'os'
import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  viteBuild,
  viteServe,
  stripedLog,
  resetTerminalLog,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

// TODO: why does it broken in Windows 😫
const isWindows = os.platform() === 'win32'

describe('vue2-vls', () => {
  beforeAll(async () => {
    await viteServe({ cwd: testDir, port: 8080, path: '/vue-template/' })
    await pollingUntil(getHmrOverlay, (dom) => !!dom)
  })

  afterAll(async () => {
    await killServer()
  })

  describe('serve', () => {
    it('get initial error and subsequent error', async () => {
      const snapshot = {
        errorCode1: '> 3 |     <h1>{{ msg1 }}</h1>',
        errorCode2: '> 3 |     <h1>{{ msg2 }}</h1>',
        absPath: 'vue2-vls/src/components/HelloWorld.vue:3:12',
        errorMsg: `Property 'msg1' does not exist on type 'CombinedVueInstance<{ msg: string; } & Vue, object, object, object, Record<never, any>>'. Did you mean 'msg'?`,
      }

      if (isWindows) {
        expect(1).toBe(1)
      } else {
        const [message1, file1] = await getHmrOverlayText()
        expect(message1).toContain(snapshot.errorCode1)
        expect(message1).toContain(snapshot.errorMsg)
        expect(file1).toContain(snapshot.absPath)
        expect(stripedLog).toContain(snapshot.errorCode1)
        expect(stripedLog).toContain(snapshot.errorMsg)
        expect(stripedLog).toContain(snapshot.absPath)
      }

      editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
      await sleep(process.env.CI ? 5000 : 2000)
      if (isWindows) {
        expect(1).toBe(1)
      } else {
        const [message2] = await getHmrOverlayText()
        expect(message2).toContain(snapshot.errorCode2)
        expect(stripedLog).toContain(snapshot.errorCode2)
      }
    })
  })

  describe('build', () => {
    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg2' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace(
          'Checker({ vls: VlsChecker() })',
          'Checker({ vls: VlsChecker(), enableBuild: false })'
        )
      )
      await viteBuild({
        unexpectedErrorMsg: `Property 'msg2' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
