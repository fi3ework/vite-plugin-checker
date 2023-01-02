import fs from 'fs'
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)

export const RUNTIME_CLIENT_RUNTIME_PATH = '/@vite-plugin-checker-runtime'
export const RUNTIME_CLIENT_ENTRY_PATH = '/@vite-plugin-checker-runtime-entry'

export const composePreambleCode = (base = '/', config: Record<string, any>) => `
import { inject } from "${base}${RUNTIME_CLIENT_RUNTIME_PATH.slice(1)}";
inject({
  overlayConfig: ${JSON.stringify(config)},
  base: "${base}",
});
`

// #region
// NOTE: sync modification with packages/runtime/src/ws.js
export const WS_CHECKER_ERROR_EVENT = 'vite-plugin-checker:error'
export const WS_CHECKER_RECONNECT_EVENT = 'vite-plugin-checker:reconnect'
// #endregion

export const runtimeSourceFilePath = import.meta.url.endsWith('.ts')
  ? // for development only, maybe should use NODE_ENV to distinguish
    _require.resolve('../@runtime/main.js')
  : _require.resolve('../../@runtime/main.js')
export const runtimeCode = `${fs.readFileSync(runtimeSourceFilePath, 'utf-8')};`
