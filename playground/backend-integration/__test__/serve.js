// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
// import kill from 'kill-port'
// import { hmrPorts, ports } from '~utils'
import { fileURLToPath } from 'node:url'

const isTest = process.env.VITEST
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function serve() {
  // await kill(port)
  const rootDir = path.resolve(__dirname, '../')

  const { createServer, port } = await import(path.resolve(rootDir, 'server.js'))
  const { app, viteDevServer } = await createServer(rootDir, port)

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
            if (viteDevServer) {
              await viteDevServer.close()
            }
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

// serve()
