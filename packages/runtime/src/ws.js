// #region
// copied from https://github.com/vitejs/vite/blob/d76db0cae645beaecd970d95b4819158c5dd568a/packages/vite/src/client/client.ts#LL25
// use server configuration, then fallback to inference
const importMetaUrl = new URL(import.meta.url)

const socketProtocol = __HMR_PROTOCOL__ || (location.protocol === 'https:' ? 'wss' : 'ws')
const hmrPort = __HMR_PORT__
const socketHost = `${__HMR_HOSTNAME__ || importMetaUrl.hostname}:${
  hmrPort || importMetaUrl.port
}${__HMR_BASE__}`
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
