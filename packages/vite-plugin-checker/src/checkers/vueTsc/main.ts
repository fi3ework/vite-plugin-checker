import { Checker } from '../../Checker'

import type { CreateDiagnostic } from '../../types'

// TODO: watch mode is not supported for now
const createDiagnostic: CreateDiagnostic<'vueTsc'> = (pluginConfig) => {
  return {
    config: (config) => {
      //
    },
    configureServer(server) {
      //
    },
  }
}

export class VueTscChecker extends Checker<'vueTsc'> {
  public constructor() {
    super({
      name: 'vueTsc',
      absFilePath: __filename,
      build: { buildBin: ['vue-tsc', ['--noEmit']] },
      createDiagnostic,
    })
  }

  public init() {
    const createServeAndBuild = super.initMainThread()
    module.exports.createServeAndBuild = createServeAndBuild
    super.initWorkerThread()
  }
}

const vueTscChecker = new VueTscChecker()
vueTscChecker.prepare()
vueTscChecker.init()
