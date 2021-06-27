/**
 * modified from https://github.com/vitejs/vite/blob/main/scripts/release.js
 */

import fs from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
import { $, cd } from 'zx'
import prompts from 'prompts'
import semver from 'semver'
import chalk from 'chalk'

const args = minimist(process.argv.slice(2))
const isDryRun = args.dry
const pkgDir = process.cwd()
const pkgPath = path.resolve(pkgDir, 'package.json')
const pkg = fs.readJsonSync(pkgPath)
const pkgName = pkg.name
const currentVersion = pkg.version

const versionIncrements = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease',
]

const inc = (i) => semver.inc(currentVersion, i, 'beta')
const step = (msg) => console.log(chalk.cyan(msg))

async function preCheck() {
  cd('../..')
  await $`npm run lint`
  await $`npm run type-check`
  await $`npm run test`
  cd(pkgDir)
}

function updateVersion(version) {
  console.log(pkgPath)
  const pkg = fs.readJsonSync(pkgPath)
  pkg.version = version
  fs.writeJsonSync(pkgPath, pkg, { spaces: 2 })
}

async function main() {
  await preCheck()
  let targetVersion = args._[0]
  const currentVersion = pkg.version

  if (!targetVersion) {
    const { release } = await prompts({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements
        .map((i) => `${i} (${inc(i)})`)
        .concat(['custom'])
        .map((i) => ({ value: i, title: i })),
    })

    if (release === 'custom') {
      const res = await prompts({
        type: 'text',
        name: 'version',
        message: 'Input custom version',
        initial: currentVersion,
      })
      targetVersion = res.version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const tag = `${pkgName}@${targetVersion}`

  const { yes } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `Releasing ${tag}. Confirm?`,
  })

  if (!yes) {
    return
  }
  step('\nUpdating package version...')
  updateVersion(targetVersion)

  step('\nGit commit & tag & push...')

  await $`pnpm run changelog`
  await $`git add .`
  await $`git commit -m "release: ${pkgName}@${targetVersion}"`

  if (!isDryRun) {
    await $`git tag v${targetVersion}`
    await $`git push`
    await $`git push origin --tags`
  }
}

main().catch((err) => {
  console.error(err)
})
