import path from 'node:path'
import fs from 'fs-extra'

const tempRuntimePath = path.resolve(
  __dirname,
  '../packages/vite-plugin-checker/src/@runtime',
)

export async function setup(): Promise<void> {
  await fs.ensureDir(tempRuntimePath)
  await fs.emptyDir(tempRuntimePath)
  await fs.copy(
    path.resolve(__dirname, '../packages/vite-plugin-checker/dist/@runtime'),
    tempRuntimePath,
    {
      dereference: false,
    },
  )
}

export async function teardown(): Promise<void> {
  fs.removeSync(tempRuntimePath)
}
