import invariant from 'tiny-invariant'
import { ErrorPayload } from 'vite'
import { isMainThread } from 'worker_threads'

import { createScript, Script } from './worker'

import type { CreateDiagnostic, PluginConfig, BuildCheckBin } from './types'

export interface CheckerAbility {
  sealConclusion: any
}

export abstract class Checker<T = any> {
  public buildBin: BuildCheckBin
  public name: string
  public absFilePath: string
  public createDiagnostic: CreateDiagnostic
  public script?: Script<any>

  public constructor({
    name,
    absFilePath,
    buildBin,
    createDiagnostic,
  }: {
    name: string
    absFilePath: string
    buildBin: BuildCheckBin
    createDiagnostic: CreateDiagnostic
  }) {
    this.name = name
    this.absFilePath = absFilePath
    this.buildBin = buildBin
    this.createDiagnostic = createDiagnostic
  }

  public prepare() {
    const script = createScript<Pick<PluginConfig, 'typescript'>>({
      absFilename: this.absFilePath,
      buildBin: this.buildBin,
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
