import spawn from 'cross-spawn'
import { describe, expect, it } from 'vitest'

import { BiomeChecker } from '../src/checkers/biome/main'
import { EslintChecker } from '../src/checkers/eslint/main'
import { StylelintChecker } from '../src/checkers/stylelint/main'
import { TscChecker } from '../src/checkers/typescript/main'

// The checkers hand their command to `spawn` as a list of arguments, without a
// shell. Every element therefore has to be one whole argument: quotes are
// stripped here, a quoted argument stays in one piece, and an empty argument is
// never passed.
const buildBin = (checker: { build: { buildBin: any } }, config: any) =>
  checker.build.buildBin(config)

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
      typescript: { root: '/repo/my project' },
    })
    expect(args).toEqual(['--noEmit', '-p', '/repo/my project'])
  })
})

describe('spawning a command built this way', () => {
  it('delivers an argument containing a space as one argument', () => {
    const target = '/repo/my project/tsconfig.json'
    const result = spawn.sync(
      process.execPath,
      ['-e', 'console.log(JSON.stringify(process.argv.slice(1)))', target],
      { encoding: 'utf8' },
    )

    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual([target])
  })
})
