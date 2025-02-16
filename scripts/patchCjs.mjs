import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  await fs.writeFile(
    path.resolve(
      __dirname,
      '../packages/vite-plugin-checker/dist/cjs/package.json',
    ),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  )
}

main()
