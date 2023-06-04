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
  const onMessage = async (data) => {
    switch (data.event) {
      case WS_CHECKER_ERROR_EVENT:
        onCustomMessage.forEach((callbackfn) => callbackfn(data.data))
        break
      case WS_CHECKER_RECONNECT_EVENT:
        onReconnectMessage.forEach((callbackfn) => callbackfn(data.data))
        break
    }
  }

  return {
    startListening: () => {
      if (import.meta.hot) {
        // listen server -> client messages
        import.meta.hot.on('vite-plugin-checker', (data) => {
          onMessage(data)
        })

        // told server that vite-plugin-checker runtime has loaded
        // then server should send stored diagnostics to display overlay
        // NOTE: sync modification with packages /packages/vite-plugin-checker/src/main.ts
        import.meta.hot.send('vite-plugin-checker', { event: 'runtime-loaded' })
      }
    },
  }
}
