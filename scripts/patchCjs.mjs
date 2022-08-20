import fs from 'fs-extra'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  await fs.outputJson(
    path.resolve(__dirname, '../packages/vite-plugin-checker/dist/cjs/package.json'),
    { type: 'commonjs' },
    {
      spaces: 2,
    }
  )
}

main()
