import fsExtra from 'fs-extra'
import { createRequire } from 'module'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFile, access, readFile, rm } from 'fs/promises'

const { copy, mkdir } = fsExtra
const _require = createRequire(import.meta.url)

// isomorphic __dirname https://antfu.me/posts/isomorphic-dirname
const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

let proxyApiPath: string
let createProgramFunction: string
try {
  // vue-tsc exposes the proxy in vue-tsc/out/index after v1.0.14
  proxyApiPath = _require.resolve('vue-tsc/out/index')
  createProgramFunction = 'createProgram'
} catch (e) {
  // @deprecated
  // will be removed in 0.6.0
  // vue-tsc exposes the proxy in vue-tsc/out/proxy before v1.0.14
  proxyApiPath = _require.resolve('vue-tsc/out/proxy')
  createProgramFunction = 'createProgramProxy'
}

export async function prepareVueTsc() {
  // 1. copy typescript to folder
  const targetTsDir = path.resolve(_dirname, 'typescript-vue-tsc')
  const vueTscFlagFile = path.resolve(targetTsDir, 'vue-tsc-resolve-path')

  let shouldBuildFixture = true
  try {
    await access(targetTsDir)
    const targetTsVersion = _require(path.resolve(targetTsDir, 'package.json')).version
    const currTsVersion = _require('typescript/package.json').version
    // check fixture versions before re-use
    await access(vueTscFlagFile)
    const fixtureFlagContent = await readFile(vueTscFlagFile, 'utf8')
    if (targetTsVersion === currTsVersion && fixtureFlagContent === proxyApiPath) {
      shouldBuildFixture = false
    }
  } catch (e) {
    // no matter what error, we should rebuild the fixture
    shouldBuildFixture = true
  }

  if (shouldBuildFixture) {
    await rm(targetTsDir, { force: true, recursive: true })
    await mkdir(targetTsDir)
    const sourceTsDir = path.resolve(_require.resolve('typescript'), '../..')
    await copy(sourceTsDir, targetTsDir)
    await writeFile(vueTscFlagFile, proxyApiPath)

    // 2. sync modification of lib/tsc.js with vue-tsc
    await overrideTscJs(_require.resolve(path.resolve(targetTsDir, 'lib/tsc.js')))
  }

  return { targetTsDir }
}

async function overrideTscJs(tscJsPath: string) {
  let result = await readFile(tscJsPath, 'utf8')
  // #region copied from https://github.com/johnsoncodehk/volar/blob/54f7186485d79bc0e9b7ec59ecbc01d681ee5310/vue-language-tools/vue-tsc/bin/vue-tsc.js
  const tryReplace = (search: RegExp | string, replace: string | ((v: string) => string)) => {
    const before = result
    // @ts-ignore
    result = result.replace(search, replace)
    if (before === result) {
      throw 'Search string not found: ' + JSON.stringify(search.toString())
    }
  }

  // add *.vue files to allow extensions
  tryReplace(/supportedTSExtensions = .*(?=;)/, (s) => s + '.concat([[".vue"]])')
  tryReplace(/supportedJSExtensions = .*(?=;)/, (s) => s + '.concat([[".vue"]])')
  tryReplace(/allSupportedExtensions = .*(?=;)/, (s) => s + '.concat([[".vue"]])')

  // proxy createProgram apis
  tryReplace(
    /function createProgram\(.+\) {/,
    (s) =>
      s + ` return require(${JSON.stringify(proxyApiPath)}).${createProgramFunction}(...arguments);` // tweak for compatibility, will be removed in 0.6.0
  )
  // #endregion

  // change tsc command to module.exports
  tryReplace(`ts.executeCommandLine(ts.sys, ts.noop, ts.sys.args);`, `module.exports = ts`)

  await writeFile(tscJsPath, result)
}
