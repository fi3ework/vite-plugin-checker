// #region
// copied from https://github.dev/vitejs/vite/blob/76bbcd09985f85f7786b7e2e2d5ce177ee7d1916/packages/vite/src/client/client.ts#L25
// use server configuration, then fallback to inference
const socketProtocol = __HMR_PROTOCOL__ || (location.protocol === 'https:' ? 'wss' : 'ws')
const socketHost = __HMR_PORT__
  ? `${__HMR_HOSTNAME__ || location.hostname}:${__HMR_PORT__}`
  : `${__HMR_HOSTNAME__ || location.hostname}`
const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')
// #endregion

// #region
// NOTE: sync modification with packages/vite-plugin-checker/client/index.ts
const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'
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
      }
    }
  }

  return {
    start: () => socket.addEventListener('message', onMessage),
  }
}
