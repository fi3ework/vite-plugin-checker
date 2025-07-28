import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { createServer as createViteServer } from 'vite'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rootDir = path.resolve(__dirname)
export const port = 3008

export async function createServer() {
  const app = express()
  const viteDevServer = await createViteServer({ root: rootDir })

  let html = await fs.promises.readFile(path.resolve(__dirname, 'index.html'), 'utf-8')

  app.get('/', async (req, res) => {
    html = html.replace(
      '<!-- VITE_CLIENT_SLOT -->',
      `
<script type="module">
  import RefreshRuntime from 'http://localhost:5173/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>

<script type="module" src="http://localhost:5173/@vite-plugin-checker-runtime-entry"></script>

<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.tsx"></script>

    `
    )
    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  })

  app.use('/', createProxyMiddleware({ target: 'http://127.0.0.1:5173', changeOrigin: true }))

  return { app, viteDevServer }
}

const isTest = process.env.VITEST

if (!isTest) {
  createServer().then(({ app, viteDevServer }) => {
    viteDevServer.listen()
    app.listen(port, () => {
      console.log('http://localhost:5173')
    })
  })
}
