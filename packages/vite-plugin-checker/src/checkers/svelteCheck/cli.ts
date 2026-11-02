import { createRequire } from 'node:module'
import path from 'node:path'
import { stripVTControlCharacters as strip } from 'node:util'
import { createFrame, tsLikeLocToBabelLoc } from '../../codeFrame.js'
import type { NormalizedDiagnostic } from '../../logger.js'
import { readSources } from '../../sources.js'
import { DiagnosticLevel } from '../../types.js'
import { parseArgsStringToArgv } from '../stylelint/argv.js'

const DEV_ONLY_FLAGS = new Set(['--watch', '--preserveWatchOutput'])

export function resolveSvelteCheckBin(root: string): string {
  const require = createRequire(path.join(root, 'package.json'))
  const pkgPath = require.resolve('svelte-check/package.json')
  const pkg = require(pkgPath) as { bin: string | Record<string, string> }
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['svelte-check']!
  return path.resolve(path.dirname(pkgPath), bin)
}

export function getDevArgs(flags: string, root: string): string[] {
  const input = parseArgsStringToArgv(flags)
  const args: string[] = []
  let workspace = root

  for (let i = 0; i < input.length; i++) {
    const arg = input[i]!
    const [name, inlineValue] = arg.split(/=(.*)/s, 2) as [string, string?]

    if (DEV_ONLY_FLAGS.has(name)) continue
    if (name === '--output' || name === '--workspace') {
      const value = inlineValue ?? input[++i]
      if (name === '--workspace' && value) workspace = path.resolve(root, value)
      continue
    }
    args.push(arg)
  }

  return [
    ...args,
    '--workspace',
    workspace,
    '--watch',
    '--output',
    'machine-verbose',
  ]
}

interface MachineDiagnostic {
  type: 'ERROR' | 'WARNING'
  filename: string
  start: { line: number; character: number }
  end: { line: number; character: number }
  message: string
  code?: string | number
  codeDescription?: { href?: string }
  source?: string
}

export function createMachineOutputParser(handlers: {
  onComplete: (diagnostics: NormalizedDiagnostic[]) => void
  onFailure: (message: string) => void
}): { push: (line: string) => void } {
  let workspace = ''
  let pending: MachineDiagnostic[] = []
  let queue = Promise.resolve()

  return {
    push(line) {
      const match = /^\d+ (START|COMPLETED|FAILURE|\{)(.*)$/.exec(line.trim())
      if (!match) return

      const [, kind, rest] = match
      switch (kind) {
        case 'START':
          workspace = JSON.parse(rest!.trim())
          pending = []
          break
        case '{':
          pending.push(JSON.parse(`{${rest}`))
          break
        case 'COMPLETED': {
          const entries = pending
          const cwd = workspace
          pending = []
          queue = queue.then(async () => {
            handlers.onComplete(await normalizeDiagnostics(entries, cwd))
          })
          break
        }
        case 'FAILURE':
          handlers.onFailure(JSON.parse(rest!.trim()))
          break
      }
    },
  }
}

async function normalizeDiagnostics(
  entries: MachineDiagnostic[],
  workspace: string,
): Promise<NormalizedDiagnostic[]> {
  const files = entries.map((d) => path.resolve(workspace, d.filename))
  const sources = await readSources([...new Set(files)])

  return entries.map((d, index) => {
    const id = files[index]!
    const loc = tsLikeLocToBabelLoc(d)
    const source = sources.get(id)
    const codeFrame = source ? createFrame(source, loc) : undefined

    const ruleUrl = d.codeDescription?.href

    return {
      message: formatMessage(d),
      rule: ruleUrl ? formatCode(d) : undefined,
      ruleUrl,
      conclusion: '',
      codeFrame,
      stripedCodeFrame: codeFrame && strip(codeFrame),
      id,
      checker: 'svelte-check',
      loc,
      level:
        d.type === 'WARNING' ? DiagnosticLevel.Warning : DiagnosticLevel.Error,
    }
  })
}

function formatCode(d: MachineDiagnostic): string | undefined {
  if (d.code === undefined || d.code === '') return undefined
  return d.source === 'ts' ? `TS${d.code}` : String(d.code)
}

function formatMessage(d: MachineDiagnostic): string {
  const code = formatCode(d)
  if (!code) return d.message
  const message = d.codeDescription?.href
    ? d.message.replace(/\nhttps?:\/\/\S+$/, '')
    : d.message
  if (message.includes(code)) return message
  return `${message} (${code})`
}
