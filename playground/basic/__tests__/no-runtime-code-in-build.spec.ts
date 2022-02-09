import fs from 'fs'
import klaw from 'klaw'
import path from 'path'
import { preTest, viteBuild } from 'vite-plugin-checker/__tests__/e2e/Sandbox/Sandbox'
import {
  editFileTo,
  sleep,
  testDir,
  WORKER_CLEAN_TIMEOUT,
} from 'vite-plugin-checker/__tests__/e2e/testUtils'

import { copyCode } from '../../../scripts/jestSetupFilesAfterEnv'
import { serializers } from '../../../scripts/serializers'

beforeAll(async () => {
  await preTest()
})

expect.addSnapshotSerializer(serializers)

afterAll(async () => {
  await sleep(WORKER_CLEAN_TIMEOUT)
})

describe('no-runtime-code-in-build', () => {
  beforeEach(async () => {
    await copyCode()
  })

  it('test', async () => {
    editFileTo('src/main.ts', `import { text } from './text'; console.log(text); export {}`)
    await viteBuild({
      cwd: testDir,
    })

    for await (const file of klaw(path.resolve(testDir, 'dist'))) {
      if (file.stats.isFile()) {
        const content = await fs.promises.readFile(file.path, 'utf-8')
        expect(content).not.toContain('vite-plugin-checker')
      }
    }
  })
})
