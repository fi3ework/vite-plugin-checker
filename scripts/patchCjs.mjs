import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cjsDist = fileURLToPath(new URL('../packages/vite-plugin-checker/dist/cjs', import.meta.url))

async function main() {
  await fs.writeFile(
    path.join(cjsDist, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  )
}

main()
