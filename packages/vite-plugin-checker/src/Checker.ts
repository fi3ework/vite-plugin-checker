import { ServeAndBuildChecker } from './types'
import invariant from 'tiny-invariant'
import { isMainThread } from 'worker_threads'

import { createScript, Script } from './worker'

import type { CreateDiagnostic, PluginConfig, BuildCheckBin } from './types'

export interface CheckerAbility {
  sealConclusion: any
}

export interface KK {
  name: string
  absFilePath: string
  createDiagnostic: CreateDiagnostic
  build: ServeAndBuildChecker['build']
  script?: Script<any>
}

export abstract class Checker<T = any> implements KK {
  public name: string
  public absFilePath: string
  public createDiagnostic: CreateDiagnostic
  public build: ServeAndBuildChecker['build']
  public script?: Script<any>

  public constructor({ name, absFilePath, createDiagnostic, build }: KK) {
    this.name = name
    this.absFilePath = absFilePath
    this.build = build
    this.createDiagnostic = createDiagnostic
    this.build = build
  }

  public prepare() {
    const script = createScript<Pick<PluginConfig, 'typescript'>>({
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
