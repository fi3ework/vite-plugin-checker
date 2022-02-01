/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import App from './App.svelte'

let enableOverlay = true
import { prepareListen, listenToCustomMessage, listenToReconnectMessage } from './ws'

class ErrorOverlay extends HTMLElement {
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.addEventListener('click', () => {
      this.close()
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

let overlayEle = null
let app = null
let checkerResultsStore = []

function updateErrorOverlay(payloads) {
  if (!enableOverlay) return

  const payloadArray = Array.isArray(payloads) ? payloads : [payloads]
  checkerResultsStore = checkerResultsStore.filter((existCheckerResult) => {
    return !payloadArray.map((p) => p.checkerId).includes(existCheckerResult.checkerId)
  })
  checkerResultsStore = [...checkerResultsStore, ...payloadArray]
  const hasErrorToShowInOverlay = checkerResultsStore.some((p) => p.errors.length)

  if (!hasErrorToShowInOverlay) {
    overlayEle?.close() // TODO: remove optional chaining
    overlayEle = null
    app = null
    return
  }

  overlayEle = new ErrorOverlay()
  document.body.appendChild(overlayEle)
  if (!app) {
    app = new App({
      target: overlayEle.root,
      props: {
        checkerResults: checkerResultsStore,
      },
    })
  } else {
    app.$$set({
      checkerResults: checkerResultsStore,
    })
  }
}

function resumeErrorOverlay(data) {
  const payloadsToResume = data.map((d) => d.data)
  updateErrorOverlay(payloadsToResume)
}

// function clearErrorOverlay() {
//   document.querySelectorAll(overlayId).forEach((n) => n.close())
//   overlayEle = null
// }

export function inject() {
  const ws = prepareListen()
  listenToCustomMessage(updateErrorOverlay)
  listenToReconnectMessage(resumeErrorOverlay)
  ws.start()
}
