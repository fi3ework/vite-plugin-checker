import { PROTOCOL_VERSION, type SnapshotPayload } from './protocol.js'
import { type CheckerStore, createCheckerStore } from './store.js'

/** State shared by every plugin instance in one Vite config. */
export interface CheckerHub {
  readonly store: CheckerStore
  readonly claims: Set<symbol>
  devtoolsClaims: Set<symbol>
  /** called when `devtoolsClaims` becomes empty or non-empty */
  devtoolsClaimListeners: Set<() => void>
  /** dev servers whose HMR channel and middleware are wired */
  readonly servers: WeakSet<object>
  readonly broadcasters: Set<() => void>
  uiUrl: string
  /** the instance that injects the in-page overlay */
  overlayOwner?: object
  devtools: boolean
}

const REGISTRY = Symbol.for(`vite-plugin-checker:hubs:${PROTOCOL_VERSION}`)

export function createHub(uiUrl: string): CheckerHub {
  return {
    store: createCheckerStore(),
    claims: new Set(),
    devtoolsClaims: new Set(),
    devtoolsClaimListeners: new Set(),
    servers: new WeakSet(),
    broadcasters: new Set(),
    uiUrl,
    devtools: false,
  }
}

/** Return the hub registered for `key`, registering `hub` if there is none. */
export function shareHub(key: object, hub: CheckerHub): CheckerHub {
  const scope = globalThis as { [REGISTRY]?: WeakMap<object, CheckerHub> }
  scope[REGISTRY] ??= new WeakMap()
  const hubs = scope[REGISTRY]
  const existing = hubs.get(key)
  if (existing) {
    // hubs registered by 1.0.0, which shares this protocol version
    existing.devtoolsClaims ??= new Set()
    existing.devtoolsClaimListeners ??= new Set()
    return existing
  }
  hubs.set(key, hub)
  return hub
}

export function snapshotOf(hub: CheckerHub): SnapshotPayload {
  return {
    protocol: PROTOCOL_VERSION,
    checkers: hub.store.getState(),
    indicatorClaimed: hub.claims.size > 0,
  }
}

export function broadcastSnapshot(hub: CheckerHub) {
  for (const broadcast of hub.broadcasters) broadcast()
}

export function notifyDevToolsClaim(hub: CheckerHub) {
  for (const listener of hub.devtoolsClaimListeners) listener()
}
