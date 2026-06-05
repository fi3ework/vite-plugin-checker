import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer as createViteServer, resolveConfig } from 'vite'
import checker from 'vite-plugin-checker'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, 'root')

export const port = 3009
export let viteServer

export async function serve() {
  const plugins = [checker({ typescript: true, overlay: true })]

  const app = express()
  const httpServer = http.createServer(app)

  const viteDevServer = await createViteServer({
    root,
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true, hmr: { server: httpServer } },
    plugins,
  })
  viteServer = viteDevServer

  await resolveConfig({ root, configFile: false, plugins }, 'serve')

  viteDevServer.listen = async () => viteDevServer
  const closeViteDevServer = viteDevServer.close.bind(viteDevServer)
  viteDevServer.close = async () => {
    await new Promise((resolve) => httpServer.close(resolve))
    await closeViteDevServer()
  }

  app.use(viteDevServer.middlewares)

  app.use(async (req, res, next) => {
    try {
      const template = fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8')
      const html = await viteDevServer.transformIndexHtml(req.originalUrl, template)
      res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
    } catch (e) {
      viteDevServer.ssrFixStacktrace(e)
      next(e)
    }
  })

  return new Promise((resolve, reject) => {
    try {
      httpServer.listen(port, () => {
        resolve({
          async close() {
            await viteDevServer.close()
          },
          viteDevServer,
          port,
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}

if (!process.env.VITEST) {
  serve().then(() => {
    console.log(`http://localhost:${port}`)
  })
}
