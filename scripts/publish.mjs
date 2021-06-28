import fs from 'fs-extra'
import { $ } from 'zx'

async function main() {
  await fs.copyFile('README.md', 'packages/vite-plugin-checker/README.md')
  await $`pnpm i`
  await $`npm run lint`
  await $`npm run type-check`
  await $`npm run test`
  await $`npm run build`
  await $`npx pnpm -r publish --access public --no-git-checks`
  await $`git clean -fd`
}

main()
