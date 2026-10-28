import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { FSWatcher } from 'chokidar'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { watchLintTargets } from '../src/checkers/_shared/lintWatcher'

describe('watchLintTargets', () => {
  let root: string
  let watcher: FSWatcher | undefined

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-watch-')))
    fs.mkdirSync(path.join(root, 'src'))
    fs.mkdirSync(path.join(root, '.git'))
    fs.mkdirSync(path.join(root, 'node_modules', 'dep'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'existing.js'), '')
  })

  afterEach(async () => {
    await watcher?.close()
    watcher = undefined
    fs.rmSync(root, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  async function startWatching(ignored?: (p: string) => boolean) {
    const changed: string[] = []
    const unlinked: string[] = []
    watcher = watchLintTargets(root, {
      root,
      ignored,
      onChange: (p) => changed.push(p),
      onUnlink: (p) => unlinked.push(p),
    })
    await new Promise<void>((resolve) => watcher!.on('ready', resolve))
    return { changed, unlinked }
  }

  it('reports added, changed and removed files with absolute paths', async () => {
    const { changed, unlinked } = await startWatching()
    expect(changed).toEqual([])

    const added = path.join(root, 'src', 'added.js')
    const existing = path.join(root, 'src', 'existing.js')
    fs.writeFileSync(added, 'var a = 1')
    await vi.waitFor(() => expect(changed).toContain(added))

    fs.writeFileSync(existing, 'var b = 1')
    await vi.waitFor(() => expect(changed).toContain(existing))

    fs.rmSync(added)
    await vi.waitFor(() => expect(unlinked).toEqual([added]))
  })

  it('never reports files under .git or node_modules', async () => {
    const { changed } = await startWatching()

    fs.writeFileSync(path.join(root, '.git', 'index.lock'), '')
    fs.writeFileSync(path.join(root, 'node_modules', 'dep', 'index.js'), '')
    const marker = path.join(root, 'src', 'marker.js')
    fs.writeFileSync(marker, '')

    await vi.waitFor(() => expect(changed).toContain(marker))
    expect(changed).toEqual([marker])
  })

  it('applies additional ignore matchers', async () => {
    const { changed } = await startWatching((p) => p.endsWith('.css'))

    fs.writeFileSync(path.join(root, 'src', 'style.css'), '')
    const marker = path.join(root, 'src', 'marker.js')
    fs.writeFileSync(marker, '')

    await vi.waitFor(() => expect(changed).toContain(marker))
    expect(changed).toEqual([marker])
  })

  it('logs watcher errors once per code instead of throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await startWatching()

    const emfile = Object.assign(new Error('EMFILE: too many open files'), {
      code: 'EMFILE',
    })
    expect(() => {
      watcher!.emit('error', emfile)
      watcher!.emit('error', emfile)
    }).not.toThrow()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('EMFILE: too many open files')
  })
})
