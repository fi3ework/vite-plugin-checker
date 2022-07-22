import invariant from 'tiny-invariant'
import { isMainThread, threadId } from 'worker_threads'

import { ServeAndBuildChecker, BuildInCheckerNames } from './types.js'
import { createScript, Script } from './worker.js'

// still an only issue https://github.com/microsoft/TypeScript/issues/29808#issuecomment-829750974
import type {} from 'vite'
import type { CreateDiagnostic, BuildInCheckers } from './types.js'

if (!(isMainThread || (threadId === 1 && process.env.VITEST))) {
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
  public static logger: ((...args: any[]) => void)[] = [
    (...args: any[]) => {
      console.log(args[0].payload)
    },
  ]

  public static log(...args: any[]) {
    this.logger.forEach((fn) => fn(...args))
  }

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
    this.build = build
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

    if (isMainThread || (threadId === 1 && process.env.VITEST)) {
      const createServeAndBuild = this.script.mainScript()
      return createServeAndBuild
    }
  }

  public initWorkerThread() {
    invariant(this.script, `script should be created in 'prepare', but got ${this.script}`)

    if (!(isMainThread || (threadId === 1 && process.env.VITEST))) {
      this.script.workerScript()
    }
  }
}
