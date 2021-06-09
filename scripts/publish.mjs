import fs from 'fs-extra'
import { $ } from 'zx'

await fs.copyFile('README.md', 'packages/vite-plugin-checker/README.md')
await $`pnpm i`
await $`npm run lint`
await $`npm run build`
await $`npx pnpm -r publish --access public --no-git-checks`
await $`git clean -fd`
