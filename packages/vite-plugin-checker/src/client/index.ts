import fs from 'fs'

// #region
// NOTE: sync modification with packages/runtime/src/ws.js
export const RUNTIME_PUBLIC_PATH = '/@vite-plugin-checker-runtime'
export const RUNTIME_FILE_PATH = require.resolve('../@runtime/main.js')
export const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
export const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'
export const WS_CHECKER_CONFIG_RUNTIME_EVENT = 'vite-plugin-checker:config-runtime'
// #endregion

export const runtimeCode = `${fs.readFileSync(RUNTIME_FILE_PATH, 'utf-8')};`
