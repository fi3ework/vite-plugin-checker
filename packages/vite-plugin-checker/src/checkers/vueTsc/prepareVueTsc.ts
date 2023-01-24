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

let proxyPath: string
let createProgramFunction: string
try {
  // vue-tsc exposes the proxy in vue-tsc/out/index after v1.0.14
  proxyPath = _require.resolve('vue-tsc/out/index')
  createProgramFunction = 'createProgram'
} catch (e) {
  // vue-tsc exposes the proxy in vue-tsc/out/proxy before v1.0.14
  proxyPath = _require.resolve('vue-tsc/out/proxy')
  createProgramFunction = 'createProgramProxy'
}

const textToReplace: { target: string; replacement: string }[] = [
  {
    target: `ts.supportedTSExtensions = [[".ts", ".tsx", ".d.ts"], [".cts", ".d.cts"], [".mts", ".d.mts"]];`,
    replacement: `ts.supportedTSExtensions = [[".ts", ".tsx", ".d.ts"], [".cts", ".d.cts"], [".mts", ".d.mts"], [".vue"]];`,
  },
  {
    target: `ts.supportedJSExtensions = [[".js", ".jsx"], [".mjs"], [".cjs"]];`,
    replacement: `ts.supportedJSExtensions = [[".js", ".jsx"], [".mjs"], [".cjs"], [".vue"]];`,
  },

  {
    target: `var allSupportedExtensions = [[".ts", ".tsx", ".d.ts", ".js", ".jsx"], [".cts", ".d.cts", ".cjs"], [".mts", ".d.mts", ".mjs"]];`,
    replacement: `var allSupportedExtensions = [[".ts", ".tsx", ".d.ts", ".js", ".jsx"], [".cts", ".d.cts", ".cjs"], [".mts", ".d.mts", ".mjs"], [".vue"]];`,
  },

  // proxy createProgram apis
  {
    target: `function createIncrementalProgram(_a) {`,
    replacement: `function createIncrementalProgram(_a) { console.error('incremental mode is not yet supported'); throw 'incremental mode is not yet supported';`,
  },
  {
    target: `function createProgram(rootNamesOrOptions, _options, _host, _oldProgram, _configFileParsingDiagnostics) {`,
    replacement: `function createProgram(rootNamesOrOptions, _options, _host, _oldProgram, _configFileParsingDiagnostics) { return require(${JSON.stringify(
      proxyPath
    )}).${createProgramFunction}(...arguments);`,
  },
  {
    target: `ts.executeCommandLine(ts.sys, ts.noop, ts.sys.args);`,
    replacement: `module.exports = ts`,
  },
]

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
    if (targetTsVersion === currTsVersion && fixtureFlagContent === proxyPath) {
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
    await writeFile(vueTscFlagFile, proxyPath)

    // 2. sync modification of lib/tsc.js with vue-tsc
    const tscJs = _require.resolve(path.resolve(targetTsDir, 'lib/tsc.js'))
    await modifyFileText(tscJs, textToReplace)
  }

  return { targetTsDir }
}

async function modifyFileText(
  filePath: string,
  textToReplace: { target: string; replacement: string }[]
) {
  const text = await readFile(filePath, 'utf8')
  let newText = text
  for (const { target, replacement } of textToReplace) {
    newText = newText.replace(target, replacement)
  }
  await writeFile(filePath, newText)
}
