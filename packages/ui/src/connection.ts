import {
  EVENT_HELLO,
  EVENT_SNAPSHOT,
  EVENT_STATUS,
  EVENT_UPDATE,
  PAGE_MARKER,
  PROTOCOL_VERSION,
  type SnapshotPayload,
  type StatusPayload,
  type UpdatePayload,
} from '../../vite-plugin-checker/src/protocol'
import { applySnapshot, applyStatus, applyUpdate, type State } from './state'

export interface HotContext {
  on(event: string, listener: (data: any) => void): void
  send(event: string, data?: unknown): void
}

/**
 * Subscribe to the dev server through Vite's HMR client, which is served next
 * to this page at `{base}@vite/client`.
 */
export async function connect(state: State, timeout = 10_000) {
  let hot: HotContext
  ;(globalThis as Record<string, unknown>)[PAGE_MARKER] = true
  try {
    const client = new URL('../@vite/client', location.href).href
    const { createHotContext } = await import(/* @vite-ignore */ client)
    hot = createHotContext(location.pathname)
  } catch {
    state.connection = 'failed'
    return
  }
  listen(state, hot, timeout)
}

/**
 * Apply the events received on `hot` to `state`.
 */
export function listen(state: State, hot: HotContext, timeout = 10_000) {
  hot.on(EVENT_SNAPSHOT, (payload: SnapshotPayload) =>
    applySnapshot(state, payload),
  )
  hot.on(EVENT_UPDATE, (payload: UpdatePayload) => applyUpdate(state, payload))
  hot.on(EVENT_STATUS, (payload: StatusPayload) => applyStatus(state, payload))
  hot.send(EVENT_HELLO, { protocol: PROTOCOL_VERSION })

  setTimeout(() => {
    if (state.connection === 'connecting') state.connection = 'failed'
  }, timeout)
}
