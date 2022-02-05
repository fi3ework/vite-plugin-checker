const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws')
const socketHost = `${location.hostname}:${location.port}`
const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')

// #region
// NOTE: sync modification with packages/vite-plugin-checker/client/index.ts
const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'
const WS_CHECKER_CONFIG_RUNTIME_EVENT = 'vite-plugin-checker:config-runtime'
// #endregion

const onCustomMessage = []
const onReconnectMessage = []
const onConfigMessage = []

export function listenToConfigMessage(cb) {
  onConfigMessage.push(cb)
}

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
    }

    if (data.type === 'custom') {
      switch (data.event) {
        case WS_CHECKER_ERROR_EVENT:
          onCustomMessage.forEach((callbackfn) => callbackfn(data.data))
          break
        case WS_CHECKER_RECONNECT_EVENT:
          onReconnectMessage.forEach((callbackfn) => callbackfn(data.data))
          break
        case WS_CHECKER_CONFIG_RUNTIME_EVENT:
          onConfigMessage.forEach((callbackfn) => callbackfn(data.data))
          break
      }
    }
  }

  return {
    start: () => socket.addEventListener('message', onMessage),
  }
}
