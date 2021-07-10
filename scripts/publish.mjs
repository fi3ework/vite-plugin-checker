import fs from 'fs-extra'
import { $ } from 'zx'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))
const distTag = args['dist-tag']

async function main() {
  await fs.copyFile('README.md', 'packages/vite-plugin-checker/README.md')
  await $`pnpm i`
  await $`npm run lint`
  await $`npm run type-check`
  await $`npm run build`
  const tagPart = distTag ? '--tag ' + distTag : ''
  await $`npx pnpm -r publish ${tagPart} --access public --no-git-checks`
  await $`git clean -fd`
}

main()
