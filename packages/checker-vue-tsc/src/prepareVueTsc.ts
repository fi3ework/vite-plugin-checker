import fsExtra from 'fs-extra'
import { createRequire } from 'node:module'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'
import { writeFile, access, readFile, rm } from 'node:fs/promises'

const { copy, mkdir } = fsExtra
const _require = createRequire(import.meta.url)

// isomorphic __dirname https://antfu.me/posts/isomorphic-dirname
const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)
const proxyApiPath = _require.resolve('vue-tsc/out/index')

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
    await overrideTscJs(
      _require.resolve(path.resolve(targetTsDir, 'lib/typescript.js')),
      currTsVersion
    )
  }

  return { targetTsDir }
}

async function overrideTscJs(tscJsPath: string, version: string) {
  let tsc = await readFile(tscJsPath, 'utf8')
  // #region copied from https://github.com/johnsoncodehk/volar/blob/54f7186485d79bc0e9b7ec59ecbc01d681ee5310/vue-language-tools/vue-tsc/bin/vue-tsc.js
  // add *.vue files to allow extensions
  tryReplace(/supportedTSExtensions = .*(?=;)/, (s: string) => s + '.concat([[".vue"]])')
  tryReplace(/supportedJSExtensions = .*(?=;)/, (s: string) => s + '.concat([[".vue"]])')
  tryReplace(/allSupportedExtensions = .*(?=;)/, (s: string) => s + '.concat([[".vue"]])')

  // proxy createProgram apis
  tryReplace(
    /function createProgram\(.+\) {/,
    (s: string) =>
      s + ` return require(${JSON.stringify(proxyApiPath)}).createProgram(...arguments);`
  )

  // patches logic for checking root file extension in build program for incremental builds
  if (semver.gt(version, '5.0.0')) {
    tryReplace(
      `for (const existingRoot of buildInfoVersionMap.roots) {`,
      `for (const existingRoot of buildInfoVersionMap.roots
				.filter(file => !file.toLowerCase().includes('__vls_'))
				.map(file => file.replace(/\.vue\.(j|t)sx?$/i, '.vue'))
			) {`
    )
  }

  function tryReplace(search: any, replace: any) {
    const before = tsc
    tsc = tsc.replace(search, replace)
    const after = tsc
    if (after === before) {
      throw 'Search string not found: ' + JSON.stringify(search.toString())
    }
  }
  // #endregion

  await writeFile(tscJsPath, tsc)
}
