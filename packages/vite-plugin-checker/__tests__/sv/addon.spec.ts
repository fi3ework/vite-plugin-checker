import fs from 'node:fs'
import path from 'node:path'
import { createSetupTest } from 'sv/testing'
import * as vitest from 'vitest'
import { version } from '../../package.json'
import addon from '../../src/sv'

const { expect } = vitest

const existingConfig = `import checker from 'vite-plugin-checker'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [checker({ typescript: true })] })
`

const viteConfigPath = (cwd: string) =>
  ['vite.config.ts', 'vite.config.js']
    .map((name) => path.join(cwd, name))
    .find((file) => fs.existsSync(file))!

const readPackageJson = (cwd: string) =>
  JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'))

const { test, testCases } = createSetupTest(vitest)(
  { addon },
  {
    kinds: [
      { type: 'default', options: { [addon.id]: {} } },
      { type: 'already-configured', options: { [addon.id]: {} } },
    ],
    browser: false,
    preAdd: ({ addonTestCase, cwd }) => {
      if (addonTestCase.kind.type !== 'already-configured') return
      fs.writeFileSync(viteConfigPath(cwd), existingConfig)
    },
  },
)

test.concurrent.for(testCases)(
  'vite-plugin-checker $kind.type $variant',
  async (testCase, ctx) => {
    const cwd = ctx.cwd(testCase)
    const viteConfig = fs.readFileSync(viteConfigPath(cwd), 'utf8')
    const { devDependencies } = readPackageJson(cwd)

    expect(devDependencies['vite-plugin-checker']).toBe(`^${version}`)
    expect(devDependencies['svelte-check']).toBeDefined()
    expect(devDependencies.typescript).toBeDefined()

    if (testCase.kind.type === 'already-configured') {
      expect(viteConfig).toBe(existingConfig)
      return
    }

    expect(viteConfig).toContain("import checker from 'vite-plugin-checker'")
    expect(viteConfig.match(/checker\(/g)).toHaveLength(1)
    if (testCase.variant === 'vite-ts') {
      expect(viteConfig).toContain(
        "svelteCheck: { flags: '--tsconfig ./tsconfig.app.json' }",
      )
    } else {
      expect(viteConfig).toContain('svelteCheck: true')
    }

    // Only the plain JS template doesn't already have svelte-check.
    expect(viteConfig.includes('enableBuild: false')).toBe(
      testCase.variant === 'vite-js',
    )
  },
)

test.concurrent.for(
  testCases.filter(
    ({ kind, variant }) => kind.type === 'default' && variant.startsWith('kit'),
  ),
)('keeps the declared TypeScript range $variant', async (testCase, ctx) => {
  const { devDependencies } = readPackageJson(ctx.cwd(testCase))

  expect(devDependencies.typescript).toBe('^6.0.3')
  expect(devDependencies['svelte-check']).toBe('^4.6.0')
})
