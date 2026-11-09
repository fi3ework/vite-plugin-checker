import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import { describe, expect, it } from 'vitest'

const mainUrl = pathToFileURL(
  path.resolve(import.meta.dirname, '../dist/main.js'),
).href

// SvelteKit resolves the Vite config inside its own worker during `vite build`.
describe('resolving the plugin in a third-party worker', () => {
  it('is not mistaken for a checker worker', async () => {
    const worker = new Worker(
      `
      const { parentPort } = require('node:worker_threads')
      import(${JSON.stringify(mainUrl)})
        .then(({ checker }) =>
          checker({ svelteCheck: true }).config(
            {},
            { command: 'build', mode: 'production' },
          ),
        )
        .then(() => {
          parentPort.postMessage('resolved')
          process.exit()
        })
      `,
      { eval: true },
    )

    const result = await new Promise((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
    })

    expect(result).toBe('resolved')
  })
})
