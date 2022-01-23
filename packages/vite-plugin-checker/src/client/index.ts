const RUNTIME_PUBLIC_PATH = '/@vite-plugin-checker/runtime'
import fs from 'fs'

const runtimeFilePath = require.resolve('../@runtime/main.js')

const runtimeCode = `
${fs.readFileSync(runtimeFilePath, 'utf-8')};
`

export { runtimeCode, RUNTIME_PUBLIC_PATH }
