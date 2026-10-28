import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'

import { checker } from '../dist/main.js'

const messagePortCount = () =>
  process.getActiveResourcesInfo().filter((name) => name === 'MessagePort')
    .length

describe('worker cleanup on dev server close', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-worker-leak-'))

  afterAll(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  it('terminates workers scoped to non-client environments', async () => {
    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          strict: true,
          target: 'ESNext',
        },
        include: ['*.ts'],
      }),
    )
    fs.writeFileSync(path.join(tempDir, 'index.ts'), 'const x: number = 1\n')

    const baseline = messagePortCount()

    const server = await createServer({
      configFile: false,
      logLevel: 'silent',
      root: tempDir,
      server: { middlewareMode: true, ws: false },
      environments: { client: {}, ssr: {} },
      plugins: [
        {
          ...checker({ vueTsc: true, overlay: false, terminal: false }),
          applyToEnvironment: (environment) => environment.name === 'client',
        },
        {
          ...checker({ vueTsc: true, overlay: false, terminal: false }),
          applyToEnvironment: (environment) => environment.name === 'ssr',
        },
      ],
    })

    await server.close()

    expect(messagePortCount()).toBe(baseline)
  }, 30_000)
})
