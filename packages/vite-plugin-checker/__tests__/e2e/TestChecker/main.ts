import {
  CreateDiagnostic,
  createScript,
  ServeAndBuildChecker,
  SharedConfig,
  BuildCheckBin,
} from 'vite-plugin-checker'
import { isMainThread } from 'worker_threads'

export const createDiagnostic: CreateDiagnostic = (userOptions = {}) => {
  let overlay = true // Vite defaults to true

  return {
    config: ({ hmr }) => {
      const viteOverlay = !(typeof hmr === 'object' && hmr.overlay === false)

      if (userOptions.overlay === false || !viteOverlay) {
        overlay = false
      }
    },
    async configureServer({ root }) {},
  }
}

export const buildBin: BuildCheckBin = ['_mock_build_cmd', ['_mock_arg1', '_mock_arg2']]

const { mainScript, workerScript } = createScript<{ testConfig: CheckerConfig }>({
  absFilename: __filename,
  buildBin,
  serverChecker: { createDiagnostic },
})!

if (isMainThread) {
  const createChecker = mainScript()
  const configCurryFn = (checkerConfig: CheckerConfig) => {
    return (sharedConfig: SharedConfig) => {
      return createChecker({ testConfig: checkerConfig, ...sharedConfig })
    }
  }

  module.exports.TestChecker = configCurryFn
  module.exports.createServeAndBuild = configCurryFn
} else {
  workerScript()
}

type CheckerConfig = Partial<{
  // TODO: support custom config
}>

declare const TestChecker: (
  options?: CheckerConfig
) => (config: CheckerConfig & SharedConfig) => ServeAndBuildChecker

export { TestChecker }
export type { CheckerConfig }
