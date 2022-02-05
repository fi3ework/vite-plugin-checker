/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import App from './App.svelte'

let enableOverlay = true
import {
  prepareListen,
  listenToCustomMessage,
  listenToReconnectMessage,
  listenToConfigMessage,
} from './ws'

let overlayEle = null
let app = null
let checkerResultsStore = []
let overlayConfig = {}

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

function configOverlay(data) {
  overlayConfig = data
}

function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => n.close())
  overlayEle = null
  app = null
}

export function inject() {
  const ws = prepareListen()
  listenToCustomMessage(updateErrorOverlay)
  listenToReconnectMessage(resumeErrorOverlay)
  listenToConfigMessage(configOverlay)
  ws.start()
}
