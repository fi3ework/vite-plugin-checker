import { createHash } from 'node:crypto'
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { createRequire } from 'node:module'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
const fixturesDir = path.resolve(_dirname, 'typescript-vue-tsc')
const tempPrefix = '.tmp-'

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  )

export async function prepareVueTsc() {
  const currTsVersion = _require('typescript/package.json').version

  const tsMajorVersion = Number(currTsVersion.split('.')[0])
  if (tsMajorVersion < 5) {
    throw new Error(
      "\x1b[35m[vite-plugin-checker] Since 0.7.0, vue-tsc checkers requires TypeScript 5.0.0 or newer version.\nPlease upgrade TypeScript, or use v0.6.4 which works with vue-tsc^1 if you can't upgrade. Check the pull request https://github.com/fi3ework/vite-plugin-checker/pull/327 for detail.\x1b[39m\n",
    )
  }

  const fixtureId = createHash('sha256')
    .update(`${currTsVersion}\0${proxyApiPath}`)
    .digest('hex')
    .slice(0, 16)
  const targetTsDir = path.join(fixturesDir, fixtureId)
  if (await exists(targetTsDir)) {
    return { targetTsDir }
  }

  // Renamed into place so that an existing fixture is always complete.
  await mkdir(fixturesDir, { recursive: true })
  const tempDir = await mkdtemp(path.join(fixturesDir, tempPrefix))
  try {
    const sourceTsDir = path.resolve(_require.resolve('typescript'), '../..')
    await cp(sourceTsDir, tempDir, { recursive: true })
    // sync modification of lib/tsc.js with vue-tsc
    await overrideTscJs(path.join(tempDir, 'lib/typescript.js'))
    await rename(tempDir, targetTsDir)
  } catch (error) {
    await rm(tempDir, { force: true, recursive: true, maxRetries: 5 }).catch(
      () => {},
    )
    if (await exists(targetTsDir)) {
      return { targetTsDir }
    }
    throw error
  }

  // `.tmp-*` entries may belong to concurrent calls that are still copying.
  const stale = (await readdir(fixturesDir)).filter(
    (e) => e !== fixtureId && !e.startsWith(tempPrefix),
  )
  await Promise.all(
    stale.map((e) =>
      rm(path.join(fixturesDir, e), { force: true, recursive: true }),
    ),
  ).catch(() => {})

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
