import fs from 'fs'
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)

// #region
// NOTE: sync modification with packages/runtime/src/ws.js
export const RUNTIME_PUBLIC_PATH = '/@vite-plugin-checker-runtime'
export const RUNTIME_FILE_PATH = import.meta.url.endsWith('.ts')
  ? _require.resolve('../@runtime/main.js')
  : _require.resolve('../../@runtime/main.js')
export const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
export const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'
// #endregion

export const runtimeCode = `${fs.readFileSync(RUNTIME_FILE_PATH, 'utf-8')};`
