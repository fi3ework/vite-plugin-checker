import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// TS 7 (the native port) dropped the JS `ts` namespace API the checker uses,
// so point `typescriptPath` at this project's own v7 install to exercise the
// child-process `tsc --watch` fallback path.
const require = createRequire(import.meta.url)
const typescriptPath = require.resolve('typescript')

export default defineConfig({
  plugins: [
    checker({
      typescript: {
        typescriptPath,
      },
    }),
  ],
})
