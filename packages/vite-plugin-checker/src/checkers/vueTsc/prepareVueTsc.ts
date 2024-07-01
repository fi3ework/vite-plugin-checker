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
const vueTscDir = dirname(_require.resolve('vue-tsc/package.json'))
let proxyApiPath = _require.resolve('@volar/typescript/lib/node/proxyCreateProgram', {
  paths: [vueTscDir],
})
let runExtensions = ['.vue']

export async function prepareVueTsc() {
  // 1. copy typescript to folder
  const targetTsDir = path.resolve(_dirname, 'typescript-vue-tsc')
  const vueTscFlagFile = path.resolve(targetTsDir, 'vue-tsc-resolve-path')
  const currTsVersion = _require('typescript/package.json').version

  let shouldBuildFixture = true
  try {
    await access(targetTsDir)
    const targetTsVersion = _require(path.resolve(targetTsDir, 'package.json')).version
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
    await overrideTscJs(_require.resolve(path.resolve(targetTsDir, 'lib/typescript.js')))
  }

  return { targetTsDir }
}

async function overrideTscJs(tscJsPath: string) {
  const languagePluginsFile = path.resolve(_dirname, 'languagePlugins.cjs')
  let tsc = await readFile(tscJsPath, 'utf8')
  // #region copied from https://github.com/volarjs/volar.js/blob/ae7f2e01caa08f64cbc687c80841dab2a0f7c426/packages/typescript/lib/quickstart/runTsc.ts
  // add *.vue files to allow extensions
  const extsText = runExtensions.map((ext) => `"${ext}"`).join(', ')
  tsc = replace(tsc, /supportedTSExtensions = .*(?=;)/, (s) => s + `.concat([[${extsText}]])`)
  tsc = replace(tsc, /supportedJSExtensions = .*(?=;)/, (s) => s + `.concat([[${extsText}]])`)
  tsc = replace(tsc, /allSupportedExtensions = .*(?=;)/, (s) => s + `.concat([[${extsText}]])`)

  // proxy createProgram
  tsc = replace(
    tsc,
    /function createProgram\(.+\) {/,
    (s) =>
      `var createProgram = require(${JSON.stringify(proxyApiPath)}).proxyCreateProgram(` +
      [
        `new Proxy({}, { get(_target, p, _receiver) { return eval(p); } } )`,
        `_createProgram`,
        `require(${JSON.stringify(languagePluginsFile)}).getLanguagePlugins`,
      ].join(', ') +
      `);\n` +
      s.replace('createProgram', '_createProgram')
  )

  function replace(_text: string, ...[search, replace]: Parameters<String['replace']>) {
    const before = _text
    const text = _text.replace(search, replace)
    const after = text
    if (after === before) {
      throw 'Search string not found: ' + JSON.stringify(search.toString())
    }
    return after
  }
  // #endregion

  await writeFile(tscJsPath, tsc)
}
