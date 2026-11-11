import { describe, expect, it, vi } from 'vitest'

import { DOCK_ID, setupDevTools } from '../src/devtools'
import type {
  CheckerApi,
  Diagnostic,
  DiagnosticSeverity,
} from '../src/protocol'
import { createCheckerStore } from '../src/store'

function diagnostic(
  level: DiagnosticSeverity,
  message: string,
  line = 1,
): Diagnostic {
  return {
    id: `${level}:${message}`,
    checkerId: 'typescript',
    level,
    message,
    file: '/project/src/main.ts',
    displayFile: 'src/main.ts',
    line,
    column: 3,
  }
}

function setup({
  indicatorClaimed = () => false,
  devtoolsClaimed = () => false,
}: {
  indicatorClaimed?: () => boolean
  devtoolsClaimed?: () => boolean
} = {}) {
  const store = createCheckerStore()
  store.register('typescript', 'TypeScript')
  const api: CheckerApi = {
    protocol: 1,
    getState: () => store.getState(),
    subscribe: (listener) => store.subscribe(listener),
    claimIndicator: vi.fn(() => () => {}),
    claimDevTools: vi.fn(() => () => {}),
    getUiUrl: () => '/app/__checker/',
  }
  const dock = { update: vi.fn() }
  const ctx = {
    docks: { register: vi.fn(() => dock) },
    messages: {
      add: vi.fn(async () => ({})),
      update: vi.fn(async () => undefined),
      remove: vi.fn(async () => {}),
    },
  }
  const listeners = new Set<() => void>()
  const dispose = setupDevTools(ctx as any, api, {
    indicator: indicatorClaimed,
    devtools: devtoolsClaimed,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  })
  const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve))
  const claimsChanged = () => {
    for (const listener of listeners) listener()
  }
  return { store, api, dock, ctx, dispose, flush, claimsChanged }
}

describe('setupDevTools', () => {
  it('registers the diagnostics page as a dock and keeps the in-page badge', () => {
    const { api, ctx } = setup()

    expect(ctx.docks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: DOCK_ID,
        type: 'iframe',
        title: 'Checker',
        url: '/app/__checker/?embed',
      }),
    )
    expect(api.claimIndicator).not.toHaveBeenCalled()
  })

  it('reports each checker with problems as one message and counts them on the dock', async () => {
    const { store, ctx, dock, flush } = setup()
    store.setDiagnostics('typescript', [
      diagnostic('warning', 'Unused variable', 1),
      diagnostic('error', "Type 'string' is not assignable", 4),
      diagnostic('error', 'Cannot find name'),
      diagnostic('info', 'Consider a const'),
    ])
    await flush()

    expect(ctx.messages.add).toHaveBeenCalledTimes(1)
    expect(ctx.messages.add).toHaveBeenCalledWith({
      id: `${DOCK_ID}:typescript`,
      level: 'error',
      message: 'TypeScript: 2 errors, 1 warning',
      description: [
        'src/main.ts:1:3: Unused variable',
        "src/main.ts:4:3: Type 'string' is not assignable",
        'src/main.ts:1:3: Cannot find name',
      ].join('\n'),
      filePosition: { file: '/project/src/main.ts', line: 4, column: 3 },
      status: 'idle',
      notify: true,
      category: 'checker',
      actions: [
        expect.objectContaining({
          kind: 'activate',
          activate: { dockId: DOCK_ID },
        }),
      ],
    })
    expect(dock.update).toHaveBeenLastCalledWith({
      badge: '3',
      badgeVariant: 'danger',
    })
  })

  it('notifies only when a checker starts reporting errors', async () => {
    const { store, ctx, flush } = setup()
    const notified = () =>
      ctx.messages.add.mock.calls.map(([entry]: any) => entry.notify)

    store.setDiagnostics('typescript', [diagnostic('warning', 'a')])
    await flush()
    store.setDiagnostics('typescript', [diagnostic('error', 'b')])
    await flush()
    store.setDiagnostics('typescript', [diagnostic('error', 'c')])
    await flush()
    store.setDiagnostics('typescript', [])
    await flush()
    store.setDiagnostics('typescript', [diagnostic('error', 'd')])
    await flush()

    expect(notified()).toEqual([false, true, false, true])
  })

  it('does not notify while an integration claims the indicator', async () => {
    let claimed = true
    const { store, ctx, dock, flush } = setup({
      indicatorClaimed: () => claimed,
    })

    store.setDiagnostics('typescript', [diagnostic('error', 'a')])
    await flush()
    store.setDiagnostics('typescript', [])
    await flush()
    claimed = false
    store.setDiagnostics('typescript', [diagnostic('error', 'b')])
    await flush()

    expect(
      ctx.messages.add.mock.calls.map(([entry]: any) => entry.notify),
    ).toEqual([false, true])
    expect(dock.update).toHaveBeenLastCalledWith({
      badge: '1',
      badgeVariant: 'danger',
    })
  })

  it('hides the dock and posts no messages while an integration claims DevTools', async () => {
    const { store, ctx, flush } = setup({ devtoolsClaimed: () => true })

    expect(ctx.docks.register).toHaveBeenCalledWith(
      expect.objectContaining({ id: DOCK_ID, when: 'false' }),
    )
    store.setDiagnostics('typescript', [diagnostic('error', 'a')])
    await flush()

    expect(ctx.messages.add).not.toHaveBeenCalled()
  })

  it('follows a DevTools claim made or released after setup', async () => {
    let claimed = false
    const { store, ctx, dock, flush, claimsChanged } = setup({
      devtoolsClaimed: () => claimed,
    })
    store.setDiagnostics('typescript', [diagnostic('error', 'a')])
    await flush()
    expect(ctx.messages.add).toHaveBeenCalledTimes(1)

    claimed = true
    claimsChanged()
    expect(dock.update).toHaveBeenLastCalledWith({ when: 'false' })
    expect(ctx.messages.remove).toHaveBeenCalledWith(`${DOCK_ID}:typescript`)

    store.setDiagnostics('typescript', [diagnostic('error', 'b')])
    await flush()
    expect(ctx.messages.add).toHaveBeenCalledTimes(1)

    claimed = false
    claimsChanged()
    expect(dock.update).toHaveBeenCalledWith({ when: undefined })
    await flush()
    expect(ctx.messages.add).toHaveBeenCalledTimes(2)
    expect(ctx.messages.add).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'TypeScript: 1 error',
        description: 'src/main.ts:1:3: b',
        notify: false,
      }),
    )
  })

  it('restores messages without notifying when released before a pending update', async () => {
    let claimed = true
    const { store, ctx, flush, claimsChanged } = setup({
      devtoolsClaimed: () => claimed,
    })
    store.setDiagnostics('typescript', [diagnostic('error', 'a')])
    claimed = false
    claimsChanged()
    await flush()

    expect(ctx.messages.add).toHaveBeenCalledTimes(1)
    expect(ctx.messages.add).toHaveBeenLastCalledWith(
      expect.objectContaining({ notify: false }),
    )
  })

  it('stops following DevTools claims when disposed', () => {
    let claimed = false
    const { dock, dispose, claimsChanged } = setup({
      devtoolsClaimed: () => claimed,
    })

    dispose()
    claimed = true
    claimsChanged()
    expect(dock.update).not.toHaveBeenCalled()
  })

  it('marks the message as loading during a re-check and removes it once clean', async () => {
    const { store, ctx, dock, flush } = setup()
    store.setDiagnostics('typescript', [diagnostic('warning', 'a')])
    await flush()

    store.setStatus('typescript', 'checking')
    await flush()
    expect(ctx.messages.add).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'loading', level: 'warn' }),
    )

    store.setDiagnostics('typescript', [])
    await flush()
    expect(ctx.messages.remove).toHaveBeenCalledWith(`${DOCK_ID}:typescript`)
    expect(dock.update).toHaveBeenLastCalledWith({
      badge: undefined,
      badgeVariant: 'warning',
    })

    store.setStatus('typescript', 'checking')
    await flush()
    expect(ctx.messages.add).toHaveBeenCalledTimes(2)
    expect(ctx.messages.update).not.toHaveBeenCalled()
  })

  it('reports a failed checker with its reason', async () => {
    const { store, ctx, flush } = setup()
    store.setStatus('typescript', 'failed', 'Cannot find tsconfig.json')
    await flush()

    expect(ctx.messages.add).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'TypeScript failed',
        description: 'Cannot find tsconfig.json',
      }),
    )
  })

  it('removes its messages when disposed', async () => {
    const { store, ctx, dispose, flush } = setup()
    store.setDiagnostics('typescript', [diagnostic('error', 'a')])
    await flush()

    dispose()
    store.setDiagnostics('typescript', [diagnostic('error', 'b')])
    await flush()

    expect(ctx.messages.remove).toHaveBeenCalledWith(`${DOCK_ID}:typescript`)
    expect(ctx.messages.add).toHaveBeenCalledTimes(1)
  })
})
