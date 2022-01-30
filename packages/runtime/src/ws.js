const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws')
const socketHost = `${location.hostname}:${location.port}`
const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')

const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'

const onCustomMessage = []
const onReconnectMessage = []

export function listenToCustomMessage(cb) {
  onCustomMessage.push(cb)
}

export function listenToReconnectMessage(cb) {
  onReconnectMessage.push(cb)
}

export function prepareListen() {
  const onMessage = async ({ data: dataStr }) => {
    const data = JSON.parse(dataStr)
    switch (data.type) {
      case 'update':
        break
      case 'full-reload':
        break
      default:
        break
    }

    if (data.type === 'custom') {
      if (data.event === WS_CHECKER_ERROR_EVENT) {
        // updateErrorOverlay(data.data)
        onCustomMessage.forEach((callbackfn) => callbackfn(data.data))
      }

      if (data.event === WS_CHECKER_RECONNECT_EVENT) {
        onReconnectMessage.forEach((callbackfn) => callbackfn(data.data))
        // resumeErrorOverlay(data.data)
      }
    }
  }

  return {
    start: () => socket.addEventListener('message', onMessage),
  }
}
