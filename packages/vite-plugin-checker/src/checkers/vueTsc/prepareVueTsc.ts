import fs from 'fs'
import path from 'path'

const proxyPath = require.resolve('vue-tsc/out/proxy')

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
    )}).createProgramProxy(...arguments);`,
  },
  {
    target: `ts.executeCommandLine(ts.sys, ts.noop, ts.sys.args);`,
    replacement: `module.exports = ts`,
  },
]

export function prepareVueTsc() {
  // 1. copy typescript to folder
  const tsDirTo = path.resolve(__dirname, 'typescript-vue-tsc')
  let shouldPrepare = false
  const exist = fs.existsSync(tsDirTo)
  if (exist) {
    const toDirVersion = require(path.resolve(tsDirTo, 'package.json')).version
    const tsVersion = require('typescript/package.json').version
    if (toDirVersion !== tsVersion) {
      shouldPrepare = true
      rimraf(tsDirTo)
    }
  } else {
    shouldPrepare = true
  }

  if (shouldPrepare) {
    fs.mkdirSync(tsDirTo)
    const tsPath = path.resolve(require.resolve('typescript'), '../..')
    copyDirRecursively(tsPath, tsDirTo)
    // 2. sync modification of lib/tsc.js with vue-tsc
    const tscJs = require.resolve(path.resolve(tsDirTo, 'lib/tsc.js'))
    modifyFileText(tscJs, textToReplace)
  }

  return { tsDirTo }
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

/**
 * https://stackoverflow.com/a/42505874
 */
function rimraf(dir_path: string) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      var entry_path = path.join(dir_path, entry)
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path)
      } else {
        fs.unlinkSync(entry_path)
      }
    })
    fs.rmdirSync(dir_path)
  }
}
