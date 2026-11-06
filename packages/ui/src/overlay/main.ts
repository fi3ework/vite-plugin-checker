import type { OverlayOptions } from '../../../vite-plugin-checker/src/client/options'
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
} from '../../../vite-plugin-checker/src/protocol'
import { CLOSE_MESSAGE, EMBED_PARAM } from '../embed'
import {
  applySnapshot,
  applyStatus,
  applyUpdate,
  createState,
  diagnosticsOf,
} from '../state'
import { countLevels } from '../view'
import { styles } from './styles'

interface HotContext {
  on(event: string, listener: (data: any) => void): void
  send(event: string, data?: unknown): void
}

const HOST_TAG = 'vite-plugin-checker-overlay'
const HEIGHT_KEY = 'vite-plugin-checker:drawer-height'
const MIN_HEIGHT = 160

const icons = {
  external:
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/></svg>',
  close:
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

/**
 * Mount the in-page badge and drawer for one dev server.
 */
export function mount(hot: HotContext | undefined, options: OverlayOptions) {
  if (!hot || typeof document === 'undefined') return
  if ((globalThis as Record<string, unknown>)[PAGE_MARKER]) return
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => mount(hot, options), {
      once: true,
    })
    return
  }

  const uiUrl = new URL(options.uiUrl, location.href).href
  const hosts = [...document.querySelectorAll<HTMLElement>(HOST_TAG)]
  if (hosts.some((host) => host.dataset.uiUrl === uiUrl)) return

  createOverlay(hot, { ...options, uiUrl }, hosts.length)
}

function createOverlay(
  hot: HotContext,
  options: OverlayOptions,
  stack: number,
) {
  const state = createState()
  const side = options.position[0] === 't' ? 't' : 'b'

  const host = document.createElement(HOST_TAG)
  host.dataset.uiUrl = options.uiUrl
  host.style.setProperty('--_stack', String(stack))
  const root = host.attachShadow({ mode: 'open' })
  root.innerHTML = `
    <style>${styles}</style>
    <button type="button" part="badge" class="badge pos-${options.position}" aria-expanded="false" hidden>
      <span class="spinner" aria-hidden="true" hidden></span>
      <span class="count error" hidden></span>
      <span class="count warning" hidden></span>
      <span class="failed" hidden></span>
      <span class="visually-hidden label"></span>
    </button>
    <section part="drawer" class="drawer side-${side}" aria-label="Checker" hidden>
      <div class="bar">
        <div class="handle" role="separator" aria-orientation="horizontal" aria-label="Resize" tabindex="0"></div>
        <a class="open" href="${options.uiUrl}" target="_blank" rel="noopener" title="Open in new tab">
          ${icons.external}<span class="visually-hidden">Open in new tab</span>
        </a>
        <button type="button" class="close" title="Close">
          ${icons.close}<span class="visually-hidden">Close</span>
        </button>
      </div>
    </section>
    <div class="visually-hidden" aria-live="polite"></div>
  `

  const $ = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector)!
  const badge = $<HTMLButtonElement>('.badge')
  const spinner = $<HTMLElement>('.spinner')
  const errors = $<HTMLElement>('.count.error')
  const warnings = $<HTMLElement>('.count.warning')
  const failedLabel = $<HTMLElement>('.failed')
  const label = $<HTMLElement>('.label')
  const drawer = $<HTMLElement>('.drawer')
  const handle = $<HTMLElement>('.handle')
  const live = $<HTMLElement>('[aria-live]')

  let iframe: HTMLIFrameElement | undefined
  let open = false
  let autoOpened = false
  let userInteracted = false
  let announced = ''

  const storedHeight = Number(readStorage(HEIGHT_KEY))
  if (storedHeight >= MIN_HEIGHT) setHeight(storedHeight)

  function setHeight(height: number) {
    const max = window.innerHeight - 24
    const clamped = Math.round(Math.min(Math.max(height, MIN_HEIGHT), max))
    drawer.style.setProperty('--_height', `${clamped}px`)
    return clamped
  }

  function otherDrawerOpen() {
    return [...document.querySelectorAll<HTMLElement>(HOST_TAG)].some(
      (other) =>
        other !== host &&
        other.shadowRoot?.querySelector('.drawer:not([hidden])'),
    )
  }

  function setOpen(value: boolean, { user = false } = {}) {
    if (user) userInteracted = true
    if (value === open) return
    open = value
    autoOpened = value && !user
    if (value && !iframe) {
      const src = new URL(options.uiUrl)
      src.searchParams.set(EMBED_PARAM, '')
      iframe = document.createElement('iframe')
      iframe.title = 'Checker diagnostics'
      iframe.src = src.href
      drawer.append(iframe)
    }
    const hadFocus = root.activeElement !== null
    render()
    if (value && user) iframe!.focus()
    if (!value && hadFocus) {
      if (badge.hidden) (document.activeElement as HTMLElement | null)?.blur()
      else badge.focus()
    }
  }

  function render() {
    const counts = countLevels(state.checkers.flatMap(diagnosticsOf))
    const failed = state.checkers.filter((c) => c.status === 'failed').length
    const busy = state.checkers.some(
      (c) => c.status === 'checking' || c.status === 'starting',
    )
    const enabled =
      options.badge === true ||
      (options.badge === 'auto' && !state.indicatorClaimed)
    const problems = counts.error + counts.warning + failed > 0

    if (enabled && !userInteracted) {
      const wanted =
        options.initialIsOpen === 'error'
          ? counts.error + failed > 0
          : options.initialIsOpen && problems
      if (wanted && !open && !otherDrawerOpen()) {
        setOpen(true)
        return
      }
      if (!problems && open && autoOpened) {
        setOpen(false)
        return
      }
    }

    drawer.hidden = !enabled || !open
    badge.hidden = !enabled || open || !problems
    badge.setAttribute('aria-expanded', String(open))
    spinner.hidden = !busy
    errors.hidden = !counts.error
    errors.textContent = String(counts.error)
    warnings.hidden = !counts.warning
    warnings.textContent = String(counts.warning)
    failedLabel.hidden = !failed
    failedLabel.textContent = failed ? `${failed} failed` : ''

    const parts = []
    if (counts.error) parts.push(plural(counts.error, 'error'))
    if (counts.warning) parts.push(plural(counts.warning, 'warning'))
    if (failed) parts.push(`${failed} failed`)
    const summary = parts.length ? parts.join(', ') : 'no problems'
    label.textContent = `Checker: ${summary}${busy ? ', checking' : ''}`

    if (enabled && summary !== announced && (announced || problems)) {
      announced = summary
      live.textContent = `Checker: ${summary}`
    }
  }

  badge.addEventListener('click', () => setOpen(!open, { user: true }))
  $('.close').addEventListener('click', () => setOpen(false, { user: true }))
  root.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Escape' && open) {
      setOpen(false, { user: true })
    }
  })
  window.addEventListener('message', (event) => {
    if (
      event.source === iframe?.contentWindow &&
      event.data?.type === CLOSE_MESSAGE
    ) {
      setOpen(false, { user: true })
    }
  })

  const heightFromPointer = (clientY: number) =>
    side === 'b' ? window.innerHeight - 12 - clientY : clientY - 12

  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    drawer.classList.add('dragging')
    const move = (e: PointerEvent) => setHeight(heightFromPointer(e.clientY))
    const up = (e: PointerEvent) => {
      drawer.classList.remove('dragging')
      handle.removeEventListener('pointermove', move)
      writeStorage(HEIGHT_KEY, String(setHeight(heightFromPointer(e.clientY))))
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up, { once: true })
  })
  handle.addEventListener('keydown', (event) => {
    const step = { ArrowUp: 32, ArrowDown: -32 }[event.key]
    if (!step) return
    event.preventDefault()
    const current = drawer.getBoundingClientRect().height
    writeStorage(
      HEIGHT_KEY,
      String(setHeight(current + (side === 'b' ? step : -step))),
    )
  })

  hot.on(EVENT_SNAPSHOT, (payload: SnapshotPayload) => {
    applySnapshot(state, payload)
    render()
  })
  hot.on(EVENT_UPDATE, (payload: UpdatePayload) => {
    applyUpdate(state, payload)
    render()
  })
  hot.on(EVENT_STATUS, (payload: StatusPayload) => {
    applyStatus(state, payload)
    render()
  })

  render()
  document.body.append(host)
  hot.send(EVENT_HELLO, { protocol: PROTOCOL_VERSION })
}
