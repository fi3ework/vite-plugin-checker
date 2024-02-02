import invariant from 'tiny-invariant'
import { isInVitestEntryThread, isMainThread } from './utils.js'

import { createScript, type Script } from './worker.js'

import type { CreateDiagnostic, ServeAndBuildChecker } from './types.js'

if (!(isMainThread || isInVitestEntryThread)) {
  process.stdout.isTTY = true
}

export interface CheckerMeta<T = unknown> {
  absFilePath: string
  createDiagnostic: CreateDiagnostic<T>
  build: ServeAndBuildChecker<T>['build']
  script?: Script<T>
}

export abstract class Checker<T = unknown> implements CheckerMeta<T> {
  public static logger: ((...v: string[]) => unknown)[] = []

  public static log(...args: any[]) {
    this.logger.forEach((fn) => fn(...args))
  }

  public absFilePath: string
  public createDiagnostic: CreateDiagnostic<T>
  public build: ServeAndBuildChecker<T>['build']
  public script?: Script<T>

  public constructor({ absFilePath, createDiagnostic, build }: CheckerMeta<T>) {
    this.absFilePath = absFilePath
    this.build = build
    this.createDiagnostic = createDiagnostic
  }

  public initMainThread() {
    invariant(this.script, `script should be created in 'prepare', but got ${this.script}`)

    if (isMainThread || isInVitestEntryThread) {
      const createServeAndBuild = this.script.mainScript()
      return createServeAndBuild
    }

    return
  }

  public initWorkerThread() {
    invariant(this.script, `script should be created in 'prepare', but got ${this.script}`)

    if (!(isMainThread || isInVitestEntryThread)) {
      this.script.workerScript()
    }
  }

  public createChecker() {
    this.script = createScript<T>({
      absFilename: this.absFilePath,
      buildBin: this.build.buildBin,
      serverChecker: { createDiagnostic: this.createDiagnostic },
    })!

    const checker = this.initMainThread()
    this.initWorkerThread()
    return checker
  }
}
