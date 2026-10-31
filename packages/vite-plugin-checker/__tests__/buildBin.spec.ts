import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { BiomeChecker } from '../src/checkers/biome/main'
import { EslintChecker } from '../src/checkers/eslint/main'
import { StylelintChecker } from '../src/checkers/stylelint/main'
import { TscChecker } from '../src/checkers/typescript/main'

// The command is spawned as a list of arguments without a shell, so every
// element has to be one whole argument with the quotes already stripped.
const root = path.normalize('/repo')
const buildBin = (checker: { build: { buildBin: any } }, config: any) =>
  checker.build.buildBin(config, { root })

describe('eslint buildBin', () => {
  const checker = new EslintChecker()

  it('splits the lint command into separate arguments', () => {
    expect(
      buildBin(checker, { eslint: { lintCommand: 'eslint --ext .ts src' } }),
    ).toEqual(['eslint', ['--ext', '.ts', 'src']])
  })

  it('keeps a quoted glob as one argument, without its quotes', () => {
    const [, args] = buildBin(checker, {
      eslint: { lintCommand: 'eslint "src/my components/**/*.ts"' },
    })
    expect(args).toEqual(['src/my components/**/*.ts'])
  })

  it('drops the quotes around an option value', () => {
    const [, args] = buildBin(checker, {
      eslint: { lintCommand: 'eslint --rule="semi: off" "./src/**/*.js"' },
    })
    expect(args).toEqual(['--rule=semi: off', './src/**/*.js'])
  })

  it('passes no arguments at all when there is no command', () => {
    expect(buildBin(checker, {})).toEqual(['eslint', []])
  })
})

describe('stylelint buildBin', () => {
  const checker = new StylelintChecker()

  it('keeps a quoted glob as one argument, without its quotes', () => {
    const [, args] = buildBin(checker, {
      stylelint: { lintCommand: 'stylelint "src/my styles/**/*.css"' },
    })
    expect(args).toEqual(['src/my styles/**/*.css'])
  })

  it('passes no arguments at all when there is no command', () => {
    expect(buildBin(checker, {})).toEqual(['stylelint', []])
  })
})

describe('biome buildBin', () => {
  const checker = new BiomeChecker()

  it('splits the flags string into separate arguments', () => {
    expect(
      buildBin(checker, {
        biome: { command: 'lint', flags: '--write --error-on-warnings' },
      }),
    ).toEqual(['biome', ['lint', '--write', '--error-on-warnings']])
  })

  it('does not pass an empty argument when there are no flags', () => {
    expect(buildBin(checker, { biome: { command: 'check' } })).toEqual([
      'biome',
      ['check'],
    ])
  })
})

describe('typescript buildBin', () => {
  const checker = new TscChecker()

  it('leaves a project path containing a space untouched', () => {
    const [, args] = buildBin(checker, {
      typescript: { root: path.join(root, 'my project') },
    })
    // The checker joins the path itself, so the separators are the platform's.
    expect(args).toEqual([
      '--noEmit',
      '-p',
      path.join('my project', 'tsconfig.json'),
    ])
  })
})
