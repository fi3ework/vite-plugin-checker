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

const existingDependencies = {
  'svelte-check': '^4.0.0',
  typescript: '~5.9.0',
  'vite-plugin-checker': '^0.14.0',
}

const viteConfigNames = ['vite.config.ts', 'vite.config.js']

const viteConfigPath = (cwd: string) =>
  viteConfigNames
    .map((name) => path.join(cwd, name))
    .find((file) => fs.existsSync(file))!

const packageJsonPath = (cwd: string) => path.join(cwd, 'package.json')

const readPackageJson = (cwd: string) =>
  JSON.parse(fs.readFileSync(packageJsonPath(cwd), 'utf8'))

const nextSteps = (cwd: string, viteConfig: string) =>
  addon.nextSteps!({ cwd, file: { viteConfig } } as never).join('\n')

// The harness installs every project after applying the add-on. Linking the
// workspace package keeps that install independent of the published versions.
function linkWorkspacePackage(cwd: string) {
  const workspaceFile = path.join(cwd, '../pnpm-workspace.yaml')
  if (fs.readFileSync(workspaceFile, 'utf8').includes('overrides:')) return
  fs.appendFileSync(
    workspaceFile,
    '\noverrides:\n  vite-plugin-checker: link:../..\n',
  )
}

const { test, testCases } = createSetupTest(vitest)(
  { addon },
  {
    kinds: [
      { type: 'default', options: { [addon.id]: {} } },
      { type: 'already-configured', options: { [addon.id]: {} } },
      { type: 'other-config-extension', options: { [addon.id]: {} } },
    ],
    filter: ({ kind, variant }) =>
      kind.type !== 'other-config-extension' || variant === 'vite-ts',
    browser: false,
    preAdd: ({ addonTestCase, cwd }) => {
      linkWorkspacePackage(cwd)

      if (addonTestCase.kind.type === 'already-configured') {
        fs.writeFileSync(viteConfigPath(cwd), existingConfig)
        const packageJson = readPackageJson(cwd)
        Object.assign(packageJson.devDependencies, existingDependencies)
        fs.writeFileSync(
          packageJsonPath(cwd),
          JSON.stringify(packageJson, null, 2),
        )
      }

      if (addonTestCase.kind.type === 'other-config-extension') {
        fs.renameSync(viteConfigPath(cwd), path.join(cwd, 'vite.config.mts'))
      }
    },
  },
)

const casesOf = (type: string) =>
  testCases.filter(({ kind }) => kind.type === type)

test.concurrent.for(casesOf('default'))(
  'adds the checker to the Vite config $variant',
  async (testCase, ctx) => {
    const cwd = ctx.cwd(testCase)
    const viteConfig = fs.readFileSync(viteConfigPath(cwd), 'utf8')
    const { devDependencies } = readPackageJson(cwd)

    expect(devDependencies['vite-plugin-checker']).toBe(`^${version}`)
    expect(devDependencies['svelte-check']).toBeDefined()
    expect(devDependencies.typescript).toBeDefined()

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

    expect(nextSteps(cwd, path.basename(viteConfigPath(cwd)))).toContain(
      'svelte-check now reports errors',
    )
  },
)

test.concurrent.for(casesOf('already-configured'))(
  'leaves an existing setup unchanged $variant',
  async (testCase, ctx) => {
    const cwd = ctx.cwd(testCase)

    expect(fs.readFileSync(viteConfigPath(cwd), 'utf8')).toBe(existingConfig)
    expect(readPackageJson(cwd).devDependencies).toMatchObject(
      existingDependencies,
    )
    expect(nextSteps(cwd, path.basename(viteConfigPath(cwd)))).toContain(
      'left unchanged',
    )
  },
)

test.concurrent.for(casesOf('other-config-extension'))(
  'does not create a second Vite config $variant',
  async (testCase, ctx) => {
    const cwd = ctx.cwd(testCase)

    expect(viteConfigPath(cwd)).toBeUndefined()
    expect(
      fs.readFileSync(path.join(cwd, 'vite.config.mts'), 'utf8'),
    ).not.toContain('vite-plugin-checker')
    expect(nextSteps(cwd, 'vite.config.js')).toContain('left unchanged')
  },
)
