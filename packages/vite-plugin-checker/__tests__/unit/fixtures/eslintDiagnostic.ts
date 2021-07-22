export const error1 = {
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
} as const

export const warning1 = { ...error1, level: 0 }
