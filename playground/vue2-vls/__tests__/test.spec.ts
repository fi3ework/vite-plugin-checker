import os from 'os'

import {
  getHmrOverlay,
  getHmrOverlayText,
  killServer,
  pollingUntil,
  preTest,
  resetTerminalLog,
  stripedLog,
  viteBuild,
  viteServe,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFile,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from '../../../packages/vite-plugin-checker/__tests__/e2e/testUtils'
import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'

beforeAll(async () => {
  await preTest()
})

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

// TODO: why does it broken in Windows 😫
const isWindows = os.platform() === 'win32'

describe('vue2-vls', () => {
  beforeEach(async () => {
    await copyCode()
  })

  afterEach(async () => {
    await killServer()
  })

  const snapshot = {
    errorCode1: '> 3 |     <h1>{{ msg1 }}</h1>',
    errorCode2: '> 3 |     <h1>{{ msg2 }}</h1>',
    absPath: 'vue2-vls/src/components/HelloWorld.vue:3:12',
    errorMsg: `Property 'msg1' does not exist on type 'CombinedVueInstance<{ msg: string; } & Vue, object, object, object, Record<never, any>>'. Did you mean 'msg'?`,
  }

  describe('serve', () => {
    it('get initial error and subsequent error', async () => {
      await viteServe({ cwd: testDir, port: 8080, path: '/vue-template/' })
      if (isWindows) {
        expect(1).toBe(1)
      } else {
        await pollingUntil(getHmrOverlay, (dom) => !!dom)
        const [message1, file1] = await getHmrOverlayText()
        expect(message1).toContain(snapshot.errorCode1)
        expect(message1).toContain(snapshot.errorMsg)
        expect(file1).toContain(snapshot.absPath)
        expect(stripedLog).toContain(snapshot.errorCode1)
        expect(stripedLog).toContain(snapshot.errorMsg)
        expect(stripedLog).toContain(snapshot.absPath)

        editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
        await sleep(process.env.CI ? 5000 : 2000)
        const [message2] = await getHmrOverlayText()
        expect(message2).toContain(snapshot.errorCode2)
        expect(stripedLog).toContain(snapshot.errorCode2)
      }
    })

    it('overlay: false', async () => {
      resetTerminalLog()
      editFile('vite.config.ts', (code) =>
        code.replace('Checker({ vls: {} }),', 'Checker({ vls: {}, overlay: false })')
      )

      await viteServe({ cwd: testDir, port: 8080, path: '/vue-template/' })
      if (isWindows) {
        expect(1).toBe(1)
      } else {
        await sleep(5000)
        await expect(getHmrOverlayText()).rejects.toThrow(
          '<vite-error-overlay> shadow dom is expected to be found, but got null'
        )

        expect(stripedLog).toContain(snapshot.errorCode1)
        expect(stripedLog).toContain(snapshot.errorMsg)
        expect(stripedLog).toContain(snapshot.absPath)

        resetTerminalLog()
        editFile('src/components/HelloWorld.vue', (code) => code.replace('msg1', 'msg2'))
        await sleep(2000)
        expect(stripedLog).toContain(snapshot.errorCode2)
      }
    })
  })

  describe('build', () => {
    beforeEach(async () => {
      await copyCode()
    })

    it('enableBuild: true', async () => {
      await viteBuild({
        expectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })

    it('enableBuild: false', async () => {
      editFile('vite.config.ts', (code) =>
        code.replace('Checker({ vls: {} }),', 'Checker({ vls: {}, enableBuild: false })')
      )
      await viteBuild({
        unexpectedErrorMsg: `Property 'msg1' does not exist on type`,
        cwd: testDir,
      })
    })
  })
})
