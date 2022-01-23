import fs from 'fs'

const RUNTIME_PUBLIC_PATH = '/@vite-plugin-checker-runtime'
const RUNTIME_FILE_PATH = require.resolve('../@runtime/main.js')
const WS_CHECKER_ERROR_TYPE = 'vite-plugin-checker-error'

const runtimeCode = `${fs.readFileSync(RUNTIME_FILE_PATH, 'utf-8')};`

export { runtimeCode, RUNTIME_PUBLIC_PATH, WS_CHECKER_ERROR_TYPE }
