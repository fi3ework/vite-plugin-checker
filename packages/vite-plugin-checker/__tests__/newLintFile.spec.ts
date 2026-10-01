import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { expect, it } from 'vitest'
import { ACTION_TYPES } from '../src/types'

const cases = [
  {
    name: 'eslint',
    configFile: 'eslint.config.mjs',
    config:
      'export default [{files: ["**/*.js"], rules: {"no-var": "error"}}]\n',
    checker: { eslint: { lintCommand: 'eslint src', dev: { debounceMs: 10 } } },
    extension: 'js',
    initial: 'const initial = 1;\n',
    added: 'var added = 1;\n',
    message: 'Unexpected var',
  },
  {
    name: 'stylelint',
    configFile: '.stylelintrc.json',
    config: JSON.stringify({ rules: { 'color-no-invalid-hex': true } }),
    checker: {
      stylelint: {
        lintCommand: 'stylelint "src/*.css"',
        dev: { debounceMs: 10 },
      },
    },
    extension: 'css',
    initial: 'a { color: #fff; }\n',
    added: 'a { color: #xyz; }\n',
    message: 'Invalid hex color',
  },
  {
    name: 'biome',
    configFile: 'biome.json',
    config: JSON.stringify({
      formatter: { enabled: false },
      linter: {
        rules: { recommended: false, suspicious: { noDebugger: 'error' } },
      },
    }),
    checker: { biome: { command: 'lint', dev: { debounceMs: 10 } } },
    extension: 'js',
    initial: 'const initial = 1;\n',
    added: 'debugger;\n',
    message: 'debugger',
  },
]

it.each(
  cases,
)('reports $name diagnostics for a newly added file without a second save', async (entry) => {
  const root = await mkdtemp(path.join(import.meta.dirname, 'lint-add-'))
  const messages: unknown[] = []
  let worker: Worker | undefined
  let workerError: Error | undefined
  try {
    await mkdir(path.join(root, 'src'))
    await writeFile(
      path.join(root, `src/initial.${entry.extension}`),
      entry.initial,
    )
    await writeFile(path.join(root, entry.configFile), entry.config)
    worker = new Worker(
      new URL(`../dist/checkers/${entry.name}/main.js`, import.meta.url),
      {
        workerData: {
          env: { command: 'serve', mode: 'development' },
          checkerConfig: entry.checker,
        },
      },
    )
    worker.on('message', (message) => messages.push(message))
    worker.on('error', (error) => {
      workerError = error
    })
    worker.postMessage({
      type: ACTION_TYPES.config,
      payload: { enableOverlay: true, enableTerminal: false },
    })
    worker.postMessage({
      type: ACTION_TYPES.configureServer,
      payload: { root },
    })
    await expect
      .poll(() => messages.length, { timeout: 10000 })
      .toBeGreaterThan(0)
    // Prove the watcher is ready via an existing file before creating a new one.
    await expect
      .poll(
        async () => {
          await writeFile(
            path.join(root, `src/initial.${entry.extension}`),
            entry.added,
          )
          return JSON.stringify(messages)
        },
        { timeout: 5000 },
      )
      .toContain(entry.message)
    messages.length = 0
    await writeFile(
      path.join(root, `src/added.${entry.extension}`),
      entry.added,
    )
    await expect
      .poll(() => JSON.stringify(messages).replace(/\\\\/g, '/'), {
        timeout: 5000,
      })
      .toContain(`src/added.${entry.extension}`)
    expect(JSON.stringify(messages)).toContain(entry.message)
    expect(workerError).toBeUndefined()
  } finally {
    await worker?.terminate()
    await rm(root, { recursive: true, force: true })
  }
}, 20000)
