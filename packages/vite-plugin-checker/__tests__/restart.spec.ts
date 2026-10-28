import asyncHooks from 'node:async_hooks'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Worker } from 'node:worker_threads'
import type { InlineConfig } from 'vite'
import { createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { checker } from '../dist/main.js'

const messagePortCount = () =>
  process.getActiveResourcesInfo().filter((name) => name === 'MessagePort')
    .length

describe('dev server restart', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-restart-'))

  beforeAll(() => {
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
  })

  afterAll(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  it('keeps the same worker alive across server.restart()', async () => {
    const workers: Worker[] = []
    const hook = asyncHooks.createHook({
      init(_asyncId, type, _triggerAsyncId, resource) {
        if (type === 'WORKER') workers.push(resource as Worker)
      },
    })
    hook.enable()

    try {
      const baseline = messagePortCount()

      const server = await createServer({
        configFile: false,
        logLevel: 'silent',
        root: tempDir,
        server: { middlewareMode: true, ws: false },
        plugins: [checker({ vueTsc: true, overlay: false, terminal: false })],
      })

      expect(messagePortCount()).toBe(baseline + 1)
      expect(workers).toHaveLength(1)
      const threadId = workers[0]!.threadId

      await server.restart()

      expect(messagePortCount()).toBe(baseline + 1)
      expect(workers).toHaveLength(1)
      expect(workers[0]!.threadId).toBe(threadId)

      await server.close()

      expect(messagePortCount()).toBe(baseline)
    } finally {
      hook.disable()
    }
  }, 30_000)

  it('shares one worker across concurrent servers using one instance', async () => {
    const baseline = messagePortCount()
    const plugin = checker({ vueTsc: true, overlay: false, terminal: false })
    const config: InlineConfig = {
      configFile: false,
      logLevel: 'silent',
      root: tempDir,
      server: { middlewareMode: true, ws: false },
      plugins: [plugin],
    }

    const [a, b] = await Promise.all([
      createServer(config),
      createServer(config),
    ])

    expect(messagePortCount()).toBe(baseline + 1)

    await a.close()

    expect(messagePortCount()).toBe(baseline + 1)

    await b.close()

    expect(messagePortCount()).toBe(baseline)
  }, 30_000)
})
