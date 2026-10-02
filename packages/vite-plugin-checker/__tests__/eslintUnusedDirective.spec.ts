import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { expect, it } from 'vitest'
import { translateOptions } from '../src/checkers/eslint/cli'
import { ACTION_TYPES } from '../src/types'

it('honors --report-unused-disable-directives with ESLint flat config', async () => {
  const root = await mkdtemp(path.join(import.meta.dirname, 'eslint-unused-'))
  const messages: unknown[] = []
  let worker: Worker | undefined
  try {
    await writeFile(
      path.join(root, 'index.js'),
      '/* eslint-disable no-var */\nconst value = 1;\n',
    )
    // Disable the default warning so the CLI flag alone must enable reporting.
    await writeFile(
      path.join(root, 'eslint.config.mjs'),
      'export default [{linterOptions: {reportUnusedDisableDirectives: "off"}, rules: {"no-var": "error"}}]\n',
    )
    worker = new Worker(
      new URL('../dist/checkers/eslint/main.js', import.meta.url),
      {
        workerData: {
          env: { command: 'serve', mode: 'development' },
          checkerConfig: {
            eslint: {
              lintCommand: 'eslint --report-unused-disable-directives index.js',
              useFlatConfig: true,
            },
          },
        },
      },
    )
    worker.on('message', (message) => messages.push(message))
    worker.postMessage({
      type: ACTION_TYPES.config,
      payload: { enableOverlay: true, enableTerminal: false },
    })
    worker.postMessage({
      type: ACTION_TYPES.configureServer,
      payload: { root },
    })
    await expect
      .poll(() => JSON.stringify(messages), { timeout: 5000 })
      .toContain('Unused eslint-disable directive')
    expect(JSON.stringify(messages)).toContain('"level":1')
  } finally {
    await worker?.terminate()
    await rm(root, { recursive: true, force: true })
  }
}, 10000)

it('does not override flat config unless the reporting flag was supplied', () => {
  expect(translateOptions({}, true).overrideConfig).not.toHaveProperty(
    'linterOptions',
  )
  expect(
    translateOptions({ reportUnusedDisableDirectives: false }, true)
      .overrideConfig,
  ).toHaveProperty('linterOptions.reportUnusedDisableDirectives', 'off')
  expect(
    translateOptions({ reportUnusedDisableDirectives: true }, true)
      .overrideConfig,
  ).toHaveProperty('linterOptions.reportUnusedDisableDirectives', 'error')
})
