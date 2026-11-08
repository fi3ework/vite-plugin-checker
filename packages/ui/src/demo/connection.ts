import { type HotContext, listen } from '../connection'
import type { State } from '../state'
import { createDemoServer, DEMO_MESSAGE, type DemoMessage } from './server'

function parentContext(): HotContext {
  const listeners = new Map<string, ((data: any) => void)[]>()
  window.addEventListener('message', (event) => {
    const message = event.data as DemoMessage | undefined
    if (event.source !== window.parent || message?.type !== DEMO_MESSAGE) return
    for (const listener of listeners.get(message.event) ?? [])
      listener(message.data)
  })
  return {
    on(event, listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), listener])
    },
    send(event, data) {
      window.parent.postMessage(
        { type: DEMO_MESSAGE, event, data } satisfies DemoMessage,
        location.origin,
      )
    },
  }
}

/**
 * Receive diagnostics from the demo server in the parent page when embedded
 * in the drawer, or from an in-page one when opened on its own.
 */
export async function connect(state: State) {
  listen(
    state,
    window.parent === window ? createDemoServer().hot() : parentContext(),
  )
}
