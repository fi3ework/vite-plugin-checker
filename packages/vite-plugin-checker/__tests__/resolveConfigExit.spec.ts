import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const distMain = pathToFileURL(
  path.resolve('packages/vite-plugin-checker/dist/main.js'),
).href
const viteEntry = import.meta.resolve('vite')

function runResolveConfig(scriptPath: string, root: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath, root], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk) => {
        stdout += chunk
      })
      child.stderr.on('data', (chunk) => {
        stderr += chunk
      })

      const timeout = setTimeout(() => {
        child.kill('SIGKILL')
        reject(
          new Error('child process did not exit, the worker kept it alive'),
        )
      }, 10_000)

      child.on('error', reject)
      child.on('exit', (code) => {
        clearTimeout(timeout)
        resolve({ code, stdout, stderr })
      })
    },
  )
}

describe('resolving config without a dev server', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vpc-resolve-config-'))
  const scriptPath = path.join(tempDir, 'resolve-config.mjs')

  beforeAll(() => {
    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          strict: true,
          target: 'ESNext',
        },
        include: ['*.ts'],
      }),
    )
    fs.writeFileSync(path.join(tempDir, 'index.ts'), 'const x: number = 1\n')
    fs.writeFileSync(
      scriptPath,
      `
        import { resolveConfig } from ${JSON.stringify(viteEntry)}
        import { checker } from ${JSON.stringify(distMain)}
        await resolveConfig(
          {
            configFile: false,
            root: process.argv[2],
            plugins: [checker({ typescript: true })],
          },
          'serve',
        )
        console.log('resolved')
      `,
    )
  })

  afterAll(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  it('lets the process exit when only resolveConfig runs', async () => {
    const { code, stdout, stderr } = await runResolveConfig(scriptPath, tempDir)

    expect(stderr).toBe('')
    expect(stdout).toContain('resolved')
    expect(code).toBe(0)
  }, 15_000)
})
