import fs, { copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'tinyglobby'

const cjsDist = fileURLToPath(new URL('../packages/vite-plugin-checker/dist/cjs', import.meta.url))

async function main() {
  await fs.writeFile(
    path.join(cjsDist, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  )

  // correct declaration file extensions
  const cjsDeclarations = await glob('**/*.d.ts', {
    absolute: true,
    cwd: cjsDist
  })

  for (const file of cjsDeclarations) {
    await copyFile(file, file.replace('.d.ts', '.d.cts'))
    await fs.rm(file)
  }
}

main()
