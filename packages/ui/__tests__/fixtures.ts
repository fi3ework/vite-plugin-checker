import type { Diagnostic } from '../../vite-plugin-checker/src/protocol'

export function diagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    id: 'a',
    checkerId: 'typescript',
    level: 'error',
    message: 'Type error',
    file: '/root/src/a.ts',
    displayFile: 'src/a.ts',
    line: 1,
    column: 1,
    ...overrides,
  }
}
