import { platform } from 'os'
import ts from 'typescript'
import type { UserConfig, ViteDevServer } from 'vite'
import { exec, ChildProcess, spawn } from 'child_process'

const placeHolders = {
  tscStart: '',
  tscEnd: ' error.',
  tscWatchStart: 'File change detected. Starting incremental compilation...',
  tscWatchEnd: '. Watching for file changes.',
}

function findOutputEnd(data: string): null | number {
  const regResult = /Found (\d+) error. Watching for file changes/.exec(data)
  if (!regResult) return null
  return Number(regResult[1])
}

function createTscProcess() {
  let overlay = true // Vite default to true
  let err: string | null = null

  return {
    config: (config: UserConfig) => {
      const hmr = config.server?.hmr
      if (typeof hmr === 'object' && hmr.overlay === false) {
        overlay = true
      }
    },
    configureServer: (server: ViteDevServer) => {
      const checkerSuffix = platform() === 'win32' ? '.cmd' : ''
      const tsProc = exec(`tsc${checkerSuffix} --noEmit --watch`, { cwd: server.config.root })
      // const tsProc = spawn('tsc', ['--noEmit', '--watch'], { cwd: root, stdio: 'pipe' })
      // diagnosticCount++
      tsProc.stdout!.on('data', (data) => {
        const dataStr = data.toString()
        const parsedError = findOutputEnd(dataStr)
        if (parsedError === 0 || parsedError === null) {
          err = null
          if (!overlay) return
          server.ws.send({
            type: 'update',
            updates: [],
          })
          return
        }

        if (parsedError > 0) {
          err = dataStr
          if (!overlay) return
          server.ws.send({
            type: 'error',
            err: {
              message: 'error msg',
              stack: 'a/b/c/d',
              id: 'ts-checker',
              frame: 'frame',
              plugin: 'tsc',
              pluginCode: 'code',
              // loc: ,
            },
          })
          return
        }

        // do not clear stdout
        // if (dataStr === '\x1Bc') return
        // console.log(data)
        // process.stdout.pipe(data)
      })
    },
  }
}

export const tscProcess = createTscProcess()
