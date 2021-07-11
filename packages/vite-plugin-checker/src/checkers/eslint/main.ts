import os from 'os'
import invariant from 'tiny-invariant'
import { ESLint } from 'eslint'
import { parentPort } from 'worker_threads'

import { Checker, CheckerAbility } from '../../Checker'
import {
  diagnosticToTerminalLog,
  diagnosticToViteError,
  ensureCall,
  normalizeTsDiagnostic,
} from '../../logger'

import type { CreateDiagnostic } from '../../types'
import type { ErrorPayload } from 'vite'

const createDiagnostic: CreateDiagnostic<'typescript'> = (pluginConfig) => {
  let overlay = true // Vite defaults to true
  let currErr: ErrorPayload['err'] | null = null

  return {
    config: ({ hmr }) => {
      const engine = new ESLint()
    },
    configureServer({ root }) {},
  }
}

export class EslintChecker extends Checker<'typescript'> implements CheckerAbility {
  public constructor() {
    super({
      name: 'typescript',
      absFilePath: __filename,
      build: { buildBin: ['tsc', ['--noEmit']] },
      createDiagnostic,
    })
  }

  public sealConclusion() {}

  public init() {
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild

    super.initWorkerThread()
  }
}

const eslintChecker = new EslintChecker()
eslintChecker.prepare()
eslintChecker.init()
