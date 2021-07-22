import type { NormalizedDiagnostic } from './../../../src/logger'
import type { ESLint } from 'eslint'

export const error1: NormalizedDiagnostic = {
  message: 'Unexpected var, use let or const instead.',
  conclusion: '',
  codeFrame:
    "  \u001b[0m \u001b[90m 1 |\u001b[39m \u001b[36mimport\u001b[39m { text } \u001b[36mfrom\u001b[39m \u001b[32m'./text'\u001b[39m\u001b[0m\n  \u001b[0m \u001b[90m 2 |\u001b[39m\u001b[0m\n  \u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 3 |\u001b[39m \u001b[36mvar\u001b[39m hello \u001b[33m=\u001b[39m \u001b[32m'Hello'\u001b[39m\u001b[0m\n  \u001b[0m \u001b[90m   |\u001b[39m \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m\n  \u001b[0m \u001b[90m 4 |\u001b[39m\u001b[0m\n  \u001b[0m \u001b[90m 5 |\u001b[39m \u001b[36mconst\u001b[39m rootDom \u001b[33m=\u001b[39m document\u001b[33m.\u001b[39mquerySelector(\u001b[32m'#root'\u001b[39m)\u001b[33m!\u001b[39m\u001b[0m\n  \u001b[0m \u001b[90m 6 |\u001b[39m rootDom\u001b[33m.\u001b[39minnerHTML \u001b[33m=\u001b[39m hello \u001b[33m+\u001b[39m text\u001b[0m",
  stripedCodeFrame:
    "    1 | import { text } from './text'\n    2 |\n  > 3 | var hello = 'Hello'\n      | ^^^^^^^^^^^^^^^^^^^\n    4 |\n    5 | const rootDom = document.querySelector('#root')!\n    6 | rootDom.innerHTML = hello + text",
  id: '/Users/vite-plugin-checker/playground/vanilla-ts/src/main.ts',
  checker: 'ESLint',
  loc: { start: { line: 3, column: 1 }, end: { line: 3, column: 20 } },
  level: 1,
}

export const warning1: NormalizedDiagnostic = { ...error1, level: 0 }

export const eslintResult1: ESLint.LintResult = {
  filePath: '/Users/vite-plugin-checker/playground/vanilla-ts/src/main.ts',
  messages: [
    {
      ruleId: 'no-var',
      severity: 2,
      message: 'Unexpected var, use let or const instead.',
      line: 3,
      column: 1,
      nodeType: 'VariableDeclaration',
      messageId: 'unexpectedVar',
      endLine: 3,
      endColumn: 20,
      fix: { range: [31, 34], text: 'let' },
    },
    {
      ruleId: 'no-var',
      severity: 2,
      message: 'Unexpected var, use let or const instead.',
      line: 4,
      column: 1,
      nodeType: 'VariableDeclaration',
      messageId: 'unexpectedVar',
      endLine: 4,
      endColumn: 22,
      fix: { range: [51, 54], text: 'let' },
    },
  ],
  errorCount: 2,
  warningCount: 0,
  fixableErrorCount: 2,
  fixableWarningCount: 0,
  source:
    "import { text } from './text'\n\nvar hello = 'Hello'\nvar hello1 = 'Hello1'\n\nconst rootDom = document.querySelector('#root')!\nrootDom.innerHTML = hello + text\n\nexport {}\n",
  usedDeprecatedRules: [],
}
