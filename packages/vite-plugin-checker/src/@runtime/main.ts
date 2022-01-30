import { ErrorOverlay, overlayId, OverlayPayload, OverlayData, WsReconnectPayload } from './overlay'
let enableOverlay = true

const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'

export function inject() {
  const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws')
  const socketHost = `${location.hostname}:${location.port}`
  const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')

  socket.addEventListener('message', async ({ data: dataStr }) => {
    const data: OverlayPayload = JSON.parse(dataStr)
    switch (data.type) {
      case 'update':
        // clearErrorOverlay()
        break
      case 'full-reload':
        break
      default:
        break
    }

    if (data.type === 'custom') {
      if (data.event === WS_CHECKER_ERROR_EVENT) {
        updateErrorOverlay(data.data)
      }

      if (data.event === WS_CHECKER_RECONNECT_EVENT) {
        resumeErrorOverlay(data.data)
      }
    }
  })
}

let overlayEle: ErrorOverlay | null = null

function resumeErrorOverlay(data: WsReconnectPayload['data']) {
  const payloadsToResume = data.map((d) => d.data)
  if (payloadsToResume.some((p) => p.errors.length)) {
    overlayEle = new ErrorOverlay(data.map((d) => d.data))
    document.body.appendChild(overlayEle)
  }
}

function updateErrorOverlay(err: OverlayData) {
  if (!enableOverlay) return

  if (overlayEle) {
    overlayEle.updateErrors(err)
    if (!overlayEle.getErrorCount()) {
      clearErrorOverlay()
    }
  } else {
    overlayEle = new ErrorOverlay(err)
    document.body.appendChild(overlayEle)
  }
}

function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => (n as ErrorOverlay).close())
  overlayEle = null
}
