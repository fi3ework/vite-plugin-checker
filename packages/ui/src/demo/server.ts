import {
  type CheckerState,
  type CheckerStatus,
  type Diagnostic,
  EVENT_HELLO,
  EVENT_SNAPSHOT,
  EVENT_STATUS,
  EVENT_UPDATE,
  PROTOCOL_VERSION,
  type SnapshotPayload,
  type StatusPayload,
  type UpdatePayload,
} from '../../../vite-plugin-checker/src/protocol'
import type { HotContext } from '../connection'
import * as scenario from './scenario'

/** `postMessage` type used between the demo page in the drawer and its parent */
export const DEMO_MESSAGE = 'vite-plugin-checker:demo'

export interface DemoMessage {
  type: typeof DEMO_MESSAGE
  event: string
  data?: unknown
}

type Send = (event: string, data: unknown) => void

export interface DemoServer {
  /** In-process HMR context, for the overlay or a standalone page. */
  hot(): HotContext
  /** Respond to `hello` messages from frames, such as the drawer's iframe. */
  serveFrames(): () => void
  close(): void
}

/**
 * Replay a short dev session: two checkers start, report diagnostics, then
 * TypeScript re-runs after a fix.
 */
export function createDemoServer(): DemoServer {
  const clients = new Map<object, Send>()
  const timers: ReturnType<typeof setTimeout>[] = []
  const startedAt = Date.now()
  const checkers: CheckerState[] = [
    {
      id: 'typescript',
      label: 'TypeScript',
      status: 'starting',
      diagnostics: [],
      lastRun: { startedAt },
    },
    {
      id: 'eslint',
      label: 'ESLint',
      status: 'starting',
      diagnostics: [],
      lastRun: { startedAt },
    },
  ]
  const [typescript, eslint] = checkers as [CheckerState, CheckerState]

  const broadcast = (event: string, data: unknown) => {
    for (const send of clients.values()) send(event, data)
  }

  const connect = (client: object, send: Send) => {
    clients.set(client, send)
    const snapshot: SnapshotPayload = {
      protocol: PROTOCOL_VERSION,
      checkers: structuredClone(checkers),
      indicatorClaimed: false,
    }
    send(EVENT_SNAPSHOT, snapshot)
  }

  const setStatus = (checker: CheckerState, status: CheckerStatus) => {
    const now = Date.now()
    checker.status = status
    checker.lastRun =
      status === 'idle'
        ? { startedAt: checker.lastRun?.startedAt ?? now, finishedAt: now }
        : { startedAt: now }
    const payload: StatusPayload = {
      checkerId: checker.id,
      label: checker.label,
      status,
      lastRun: { ...checker.lastRun },
    }
    broadcast(EVENT_STATUS, payload)
  }

  const report = (checker: CheckerState, diagnostics: Diagnostic[]) => {
    const files: Record<string, Diagnostic[]> = {}
    for (const { file = '' } of checker.diagnostics) files[file] = []
    for (const diagnostic of diagnostics) {
      const file = diagnostic.file ?? ''
      files[file] = [...(files[file] ?? []), diagnostic]
    }
    checker.diagnostics = diagnostics
    const payload: UpdatePayload = { checkerId: checker.id, files }
    broadcast(EVENT_UPDATE, payload)
    setStatus(checker, 'idle')
  }

  const at = (ms: number, step: () => void) => {
    timers.push(setTimeout(step, ms))
  }
  at(1200, () => report(typescript, scenario.typescript))
  at(1800, () => report(eslint, scenario.eslint))
  at(7000, () => setStatus(typescript, 'checking'))
  at(7800, () => report(typescript, scenario.typescriptFixed))

  return {
    hot() {
      const listeners = new Map<string, ((data: any) => void)[]>()
      const dispatch: Send = (event, data) => {
        for (const listener of listeners.get(event) ?? []) listener(data)
      }
      return {
        on(event, listener) {
          listeners.set(event, [...(listeners.get(event) ?? []), listener])
        },
        send(event) {
          if (event === EVENT_HELLO) connect(dispatch, dispatch)
        },
      }
    },

    serveFrames() {
      const onMessage = (event: MessageEvent) => {
        const message = event.data as DemoMessage | undefined
        if (message?.type !== DEMO_MESSAGE || message.event !== EVENT_HELLO)
          return
        const source = event.source as Window | null
        if (!source) return
        connect(source, (event, data) =>
          source.postMessage(
            { type: DEMO_MESSAGE, event, data } satisfies DemoMessage,
            location.origin,
          ),
        )
      }
      window.addEventListener('message', onMessage)
      return () => window.removeEventListener('message', onMessage)
    },

    close() {
      for (const timer of timers) clearTimeout(timer)
      clients.clear()
    },
  }
}
