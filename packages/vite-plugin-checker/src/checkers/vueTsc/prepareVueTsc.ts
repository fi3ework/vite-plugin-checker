import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import lockfile from 'proper-lockfile'

const _require = createRequire(import.meta.url)

// isomorphic __dirname https://antfu.me/posts/isomorphic-dirname
const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)
const vueTscDir = dirname(_require.resolve('vue-tsc/package.json'))
const proxyApiPath = _require.resolve(
  '@volar/typescript/lib/node/proxyCreateProgram',
  {
    paths: [vueTscDir],
  },
)
const extraSupportedExtensions = ['.vue']

const LOCK_TIMEOUT_MS = 60000 // Max wait time
const STALE_TIMEOUT_MS = 30000 // Auto-release stale locks

async function isFixtureValid(
  targetTsDir: string,
  vueTscFlagFile: string,
  currTsVersion: string,
) {
  try {
    await access(targetTsDir)
    const targetTsVersion = _require(
      path.resolve(targetTsDir, 'package.json'),
    ).version
    await access(vueTscFlagFile)
    const fixtureFlagContent = await readFile(vueTscFlagFile, 'utf8')
    return (
      targetTsVersion === currTsVersion && fixtureFlagContent === proxyApiPath
    )
  } catch {
    return false
  }
}

export async function prepareVueTsc() {
  const targetTsDir = path.resolve(_dirname, 'typescript-vue-tsc')
  const vueTscFlagFile = path.resolve(targetTsDir, 'vue-tsc-resolve-path')
  const currTsVersion = _require('typescript/package.json').version

  const tsMajorVersion = Number(currTsVersion.split('.')[0])
  if (tsMajorVersion < 5) {
    throw new Error(
      "\x1b[35m[vite-plugin-checker] Since 0.7.0, vue-tsc checkers requires TypeScript 5.0.0 or newer version.\nPlease upgrade TypeScript, or use v0.6.4 which works with vue-tsc^1 if you can't upgrade. Check the pull request https://github.com/fi3ework/vite-plugin-checker/pull/327 for detail.\x1b[39m\n",
    )
  }

  if (await isFixtureValid(targetTsDir, vueTscFlagFile, currTsVersion)) {
    return { targetTsDir }
  }

  const release = await lockfile.lock(_dirname, {
    lockfilePath: path.resolve(_dirname, '.vue-tsc-fixture.lock'),
    stale: STALE_TIMEOUT_MS,
    retries: {
      retries: Math.ceil(LOCK_TIMEOUT_MS / 1000),
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 2000,
      randomize: true,
    },
  })

  try {
    // Double-check that the fixture is valid, another process may have built while trying to acquire the lock
    if (await isFixtureValid(targetTsDir, vueTscFlagFile, currTsVersion)) {
      return { targetTsDir }
    }

    await rm(targetTsDir, { force: true, recursive: true })
    await mkdir(targetTsDir, { recursive: true })
    const sourceTsDir = path.resolve(_require.resolve('typescript'), '../..')
    await cp(sourceTsDir, targetTsDir, { recursive: true })
    await writeFile(vueTscFlagFile, proxyApiPath)

    // sync modification of lib/tsc.js with vue-tsc
    await overrideTscJs(
      _require.resolve(path.resolve(targetTsDir, 'lib/typescript.js')),
    )
  } finally {
    await release()
  }

  return { targetTsDir }
}

async function overrideTscJs(tscJsPath: string) {
  const languagePluginsFile = path.resolve(_dirname, 'languagePlugins.cjs')
  let tsc = await readFile(tscJsPath, 'utf8')
  // #region copied from https://github.com/volarjs/volar.js/blob/630f31118d3986c00cc730eb83cd896709fd547e/packages/typescript/lib/quickstart/runTsc.ts
  // add *.vue files to allow extensions
  const extsText = extraSupportedExtensions.map((ext) => `"${ext}"`).join(', ')
  // tsc = replace(tsc, /supportedTSExtensions = .*(?=;)/, (s) => `${s}.concat([[${extsText}]])`)
  tsc = replace(
    tsc,
    /supportedTSExtensions = .*(?=;)/,
    (s) =>
      s +
      `.map((group, i) => i === 0 ? group.splice(0, 0, ${extsText}) && group : group)`,
  )
  tsc = replace(
    tsc,
    /supportedJSExtensions = .*(?=;)/,
    (s) =>
      s +
      `.map((group, i) => i === 0 ? group.splice(0, 0, ${extsText}) && group : group)`,
  )
  tsc = replace(
    tsc,
    /allSupportedExtensions = .*(?=;)/,
    (s) =>
      s +
      `.map((group, i) => i === 0 ? group.splice(0, 0, ${extsText}) && group : group)`,
  )

  const extsText2 = extraSupportedExtensions.map((ext) => `"${ext}"`).join(', ')
  tsc = replace(
    tsc,
    /function changeExtension\(/,
    (s) =>
      `function changeExtension(path, newExtension) {
					return [${extsText2}].some(ext => path.endsWith(ext))
						? path + newExtension
						: _changeExtension(path, newExtension)
					}\n${s.replace('changeExtension', '_changeExtension')}`,
  )

  // proxy createProgram
  tsc = replace(
    tsc,
    /function createProgram\(.+\) {/,
    (s) =>
      `var createProgram = require(${JSON.stringify(
        proxyApiPath,
      )}).proxyCreateProgram(${[
        'new Proxy({}, { get(_target, p, _receiver) { return eval(p); } } )',
        '_createProgram',
        `require(${JSON.stringify(languagePluginsFile)}).getLanguagePlugins`,
      ].join(', ')});\n${s.replace('createProgram', '_createProgram')}`,
  )

  function replace(
    _text: string,
    ...[search, replace]: Parameters<string['replace']>
  ) {
    const before = _text
    const text = _text.replace(search, replace)
    const after = text
    if (after === before) {
      throw `Search string not found: ${JSON.stringify(search.toString())}`
    }
    return after
  }
  // #endregion

  await writeFile(tscJsPath, tsc)
}
