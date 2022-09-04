import fs from 'fs-extra'
import { $, cd } from 'zx'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))
const distTag = args['dist-tag']

async function main() {
  await fs.copyFile('README.md', 'packages/vite-plugin-checker/README.md')
  await $`pnpm i`
  await $`npm run format`
  await $`npm run lint`
  await $`npm run type-check`
  await $`npm run clean`
  await $`npm run build`
  const tagPart = distTag ? `--tag ${distTag}` : ''
  // https://github.com/google/zx/issues/144#issuecomment-859745076
  const q = $.quote
  $.quote = (v) => v
  cd(`./packages/vite-plugin-checker`)
  console.log(`🧪 Releasing in @${distTag || 'latest'} dist-tag ...`)
  await $`npm publish ${tagPart}`
  $.quote = q
  await $`cd ../..`
  await $`git clean -fd`
}

main()
