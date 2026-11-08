// biome-ignore-all lint/suspicious/noTemplateCurlyInString: source code of the demo project
import type { Diagnostic } from '../../../vite-plugin-checker/src/protocol'

const root = '/project'

const files = {
  api: {
    lang: 'ts',
    lines: [
      "import type { User } from './user'",
      '',
      'export async function fetchUser(id: string): Promise<User> {',
      '  const response = await fetch(`/api/users/${id}`)',
      '  const data: any = await response.json()',
      '  return { id: data.id, name: data.name, email: data.email ?? null }',
      '}',
    ],
  },
  main: {
    lang: 'ts',
    lines: [
      "import { fetchUser } from './api'",
      "import { greet } from './user'",
      '',
      "var app = document.querySelector('#app')!",
      'const user = await fetchUser(1)',
      '',
      'app.textContent = greet(user)',
    ],
  },
  user: {
    lang: 'ts',
    lines: [
      'export interface User {',
      '  id: number',
      '  name: string',
      '  email?: string',
      '}',
      '',
      'export function greet(user: User) {',
      '  return `Hello, ${user.nmae}!`',
      '}',
    ],
  },
}

type File = keyof typeof files

function at(
  file: File,
  line: number,
  column: number,
  length: number,
  diagnostic: Pick<Diagnostic, 'id' | 'checkerId' | 'level' | 'message'> &
    Partial<Diagnostic>,
): Diagnostic {
  const { lang, lines } = files[file]
  const start = Math.max(1, line - 2)
  return {
    file: `${root}/src/${file}.ts`,
    displayFile: `src/${file}.ts`,
    line,
    column,
    endLine: line,
    endColumn: column + length,
    snippet: { start, lang, lines: lines.slice(start - 1, line + 2) },
    ...diagnostic,
  }
}

const typo = at('user', 8, 25, 4, {
  id: 'ts-typo',
  checkerId: 'typescript',
  level: 'error',
  code: 'TS2551',
  message:
    "Property 'nmae' does not exist on type 'User'. Did you mean 'name'?",
})

export const typescript: Diagnostic[] = [
  at('main', 5, 30, 1, {
    id: 'ts-argument',
    checkerId: 'typescript',
    level: 'error',
    code: 'TS2345',
    message:
      "Argument of type 'number' is not assignable to parameter of type 'string'.",
  }),
  typo,
]

/** TypeScript diagnostics once the typo in `src/user.ts` is fixed */
export const typescriptFixed = typescript.filter((d) => d !== typo)

export const eslint: Diagnostic[] = [
  at('main', 4, 1, 41, {
    id: 'eslint-no-var',
    checkerId: 'eslint',
    level: 'error',
    code: 'no-var',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-var',
    message: 'Unexpected var, use let or const instead.',
  }),
  at('api', 5, 15, 3, {
    id: 'eslint-any',
    checkerId: 'eslint',
    level: 'warning',
    code: '@typescript-eslint/no-explicit-any',
    docsUrl: 'https://typescript-eslint.io/rules/no-explicit-any',
    message: 'Unexpected any. Specify a different type.',
  }),
]
