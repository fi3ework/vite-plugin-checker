import type { ErrorPayload } from 'vite'
import { ErrorOverlay, overlayId } from './overlay'
let enableOverlay = true

const WS_CHECKER_ERROR_TYPE = 'vite-plugin-checker-error'
export function inject() {
  const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws')
  const socketHost = `${null || location.hostname}:${'3000'}`
  const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')

  socket.addEventListener('message', async ({ data: dataStr }) => {
    const data = JSON.parse(dataStr)
    if (data.type === WS_CHECKER_ERROR_TYPE) {
      createErrorOverlay([data.err])
    }
  })
}

function createErrorOverlay(err: ErrorPayload['err'][]) {
  if (!enableOverlay) return
  clearErrorOverlay()
  document.body.appendChild(new ErrorOverlay(err))
}

function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => (n as ErrorOverlay).close())
}
