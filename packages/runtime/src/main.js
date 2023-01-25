/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import App from './App.svelte'

let enableOverlay = true
import { prepareListen, listenToCustomMessage, listenToReconnectMessage } from './ws'

let app = null
let overlayEle = null
let checkerResultsStore = []
let overlayConfig = {}
let base = null

class ErrorOverlay extends HTMLElement {
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.addEventListener('click', () => {
      clearErrorOverlay()
    })
  }

  close() {
    this.parentNode?.removeChild(this)
  }
}

const overlayId = 'vite-plugin-checker-error-overlay'
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, ErrorOverlay)
}

function updateErrorOverlay(payloads) {
  if (!enableOverlay) return

  const payloadArray = Array.isArray(payloads) ? payloads : [payloads]
  checkerResultsStore = checkerResultsStore.filter((existCheckerResult) => {
    return !payloadArray.map((p) => p.checkerId).includes(existCheckerResult.checkerId)
  })

  checkerResultsStore = [...checkerResultsStore, ...payloadArray]
  const hasDiagnosticToShowInOverlay = checkerResultsStore.some((p) => p.diagnostics.length)

  // remove overlay when no error exists
  if (!hasDiagnosticToShowInOverlay) {
    clearErrorOverlay()
    overlayEle = null
    app = null
    return
  }

  if (!overlayEle) {
    // if after full-reload
    overlayEle = new ErrorOverlay()
    document.body.appendChild(overlayEle)
    app = new App({
      target: overlayEle.root,
      props: {
        base,
        checkerResults: checkerResultsStore,
        overlayConfig,
      },
    })
  } else {
    // HMR update
    app.$$set({
      checkerResults: checkerResultsStore,
    })
  }
}

function resumeErrorOverlay(data) {
  const payloadsToResume = data.map((d) => d.data)
  updateErrorOverlay(payloadsToResume)
}

function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => n.close())
  overlayEle = null
  app = null
}

export function inject(params) {
  base = params.base
  overlayConfig = params.overlayConfig
  const ws = prepareListen()

  listenToCustomMessage(updateErrorOverlay)
  listenToReconnectMessage(resumeErrorOverlay)

  ws.startListening()
}
