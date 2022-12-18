import fs from 'fs'
import { createRequire } from 'module'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
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

export function prepareVueTsc() {
  // 1. copy typescript to folder
  const targetTsDir = path.resolve(_dirname, 'typescript-vue-tsc')
  const vueTscFlagFile = path.resolve(targetTsDir, 'vue-tsc-resolve-path')

  let shouldPrepare = true
  const targetDirExist = fs.existsSync(targetTsDir)
  if (targetDirExist) {
    try {
      const targetTsVersion = _require(path.resolve(targetTsDir, 'package.json')).version
      const currTsVersion = _require('typescript/package.json').version
      // check fixture versions before re-use
      if (
        targetTsVersion === currTsVersion &&
        fs.existsSync(vueTscFlagFile) &&
        fs.readFileSync(vueTscFlagFile, 'utf8') === proxyPath
      ) {
        shouldPrepare = true
      }
    } catch {
      shouldPrepare = true
    }
  }

  if (shouldPrepare) {
    rimraf(targetTsDir)
    fs.mkdirSync(targetTsDir)
    const sourceTsDir = path.resolve(_require.resolve('typescript'), '../..')
    copyDirRecursively(sourceTsDir, targetTsDir)
    fs.writeFileSync(vueTscFlagFile, proxyPath)

    // 2. sync modification of lib/tsc.js with vue-tsc
    const tscJs = _require.resolve(path.resolve(targetTsDir, 'lib/tsc.js'))
    modifyFileText(tscJs, textToReplace)
  }

  return { targetTsDir: targetTsDir }
}

function modifyFileText(
  filePath: string,
  textToReplace: { target: string; replacement: string }[]
) {
  const text = fs.readFileSync(filePath, 'utf8')
  let newText = text
  for (const { target, replacement } of textToReplace) {
    newText = newText.replace(target, replacement)
  }
  fs.writeFileSync(filePath, newText)
}

function copyDirRecursively(src: string, dest: string) {
  const files = fs.readdirSync(src, { withFileTypes: true })
  for (const file of files) {
    const srcPath = path.join(src, file.name)
    const destPath = path.join(dest, file.name)
    if (file.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDirRecursively(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * https://stackoverflow.com/a/42505874
 */
function rimraf(dir_path: string) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach((entry) => {
      const entry_path = path.join(dir_path, entry)
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path)
      } else {
        fs.unlinkSync(entry_path)
      }
    })
    fs.rmdirSync(dir_path)
  }
}
