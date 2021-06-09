/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { $ } from 'zx'

await $`npm run lint`

const isBeta = process.argv[3] === '--beta'
const betaScript = isBeta ? '--prerelease beta' : ''

execSync(
  `pnpm -r --filter ./packages exec --\
    standard-version\
    ${betaScript}\
    --skip.commit=true\
    --skip.tag=true`
)

const { version } = await fs.readJSON(
  path.resolve(__dirname, '../packages/vite-plugin-checker/package.json')
)

console.log(`Going to release v${version}`)

await $`git add .`
await $`git commit -m "chore: release v${version}"`
await $`git tag v${version}`
await $`git push`
await $`git push origin --tags`
