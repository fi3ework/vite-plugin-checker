import { existsSync } from 'node:fs'
import path from 'node:path'
import { color, transforms } from '@sveltejs/sv-utils'
import { defineAddon } from 'sv'
import { version } from '../package.json'

const packageName = 'vite-plugin-checker'
const docsUrl = 'https://vite-plugin-checker.netlify.app/checkers/svelte-check'

export default defineAddon({
  id: packageName,
  shortDescription: 'svelte-check in your terminal and browser',
  homepage: docsUrl,
  options: {},

  run: ({ sv, file, cwd, dependencyVersion }) => {
    const hasSvelteCheck = Boolean(dependencyVersion('svelte-check'))

    sv.devDependency(packageName, `^${version}`)

    // Guarded because `sv.devDependency` replaces a declared range that is
    // outside the requested one, which could downgrade the project.
    if (!hasSvelteCheck) sv.devDependency('svelte-check', '^4.7.6')
    if (!dependencyVersion('typescript')) {
      sv.devDependency('typescript', '^6.0.3')
    }

    // The tsconfig.json of `sv create`'s Vite template only holds project
    // references, so svelte-check has to be pointed at the app config.
    const svelteCheck = existsSync(path.join(cwd, 'tsconfig.app.json'))
      ? `{ flags: '--tsconfig ./tsconfig.app.json' }`
      : 'true'

    const checkerOptions = [`svelteCheck: ${svelteCheck}`]
    // A project that has never run svelte-check can have errors nobody has
    // seen yet, and adding this add-on shouldn't be what breaks its build.
    if (!hasSvelteCheck) checkerOptions.push('enableBuild: false')

    sv.file(
      file.viteConfig,
      transforms.script(({ ast, content, js }) => {
        if (content.includes(packageName)) return false

        js.imports.addDefault(ast, { as: 'checker', from: packageName })
        js.vite.addPlugin(ast, {
          code: `checker({ ${checkerOptions.join(', ')} })`,
        })
        return undefined
      }),
    )
  },

  nextSteps: () => [
    'svelte-check now reports errors in your terminal and browser while the dev server runs',
    `Use the ${color.command('enableBuild')} checker option to control whether ${color.command('vite build')} also runs svelte-check and fails on errors`,
    `Docs: ${color.website(docsUrl)}`,
  ],
})
