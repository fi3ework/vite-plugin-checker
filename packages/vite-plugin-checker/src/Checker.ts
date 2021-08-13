import chokidar from 'chokidar'
import invariant from 'tiny-invariant'
import { isMainThread } from 'worker_threads'

import { NormalizedDiagnostic } from './logger'
import { BuildInCheckerNames, ServeAndBuildChecker } from './types'
import { createScript, Script } from './worker'

// still an only issue https://github.com/microsoft/TypeScript/issues/29808#issuecomment-829750974
import type {} from 'vite'
import type { CreateDiagnostic, BuildInCheckers } from './types'

if (!isMainThread) {
  process.stdout.isTTY = true
}

export interface CheckerMeta<T extends BuildInCheckerNames> {
  name: T
  absFilePath: string
  createDiagnostic: CreateDiagnostic<T>
  build: ServeAndBuildChecker['build']
  script?: Script<any>
}

export abstract class Checker<T extends BuildInCheckerNames> implements CheckerMeta<T> {
  public static watcher: chokidar.FSWatcher = chokidar.watch([], {
    ignored: (path: string) => path.includes('node_modules'),
  })

  public name: T
  public absFilePath: string
  public createDiagnostic: CreateDiagnostic<T>
  public build: ServeAndBuildChecker['build']
  public script?: Script<any>

  public constructor({ name, absFilePath, createDiagnostic, build }: CheckerMeta<T>) {
    this.name = name
    this.absFilePath = absFilePath
    this.build = build
    this.createDiagnostic = createDiagnostic
  }

  public prepare() {
    const script = createScript<Pick<BuildInCheckers, T>>({
      absFilename: this.absFilePath,
      buildBin: this.build.buildBin,
      serverChecker: { createDiagnostic: this.createDiagnostic },
    })!

    this.script = script
    return script
  }

  public initMainThread() {
    invariant(this.script, `script should be created in 'prepare', but got ${this.script}`)

    if (isMainThread) {
      const createServeAndBuild = this.script.mainScript()
      return createServeAndBuild
    }
  }

  public initWorkerThread() {
    invariant(this.script, `script should be created in 'prepare', but got ${this.script}`)

    if (!isMainThread) {
      this.script.workerScript()
    }
  }
}
