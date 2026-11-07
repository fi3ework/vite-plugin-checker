import type {
  DevToolsMessageEntryInput,
  DevToolsViewIframe,
  ViteDevToolsNodeContext,
} from '@vitejs/devtools-kit'
import type { CheckerApi, CheckerState, Diagnostic } from './protocol.js'

export const DOCK_ID = 'vite-plugin-checker'
const MESSAGE_LIMIT = 3

type DevToolsContext = Pick<ViteDevToolsNodeContext, 'docks' | 'messages'>

const icon = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.75l7.5 3v5.5c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-5.5z"/><path d="M8.5 12.25l2.5 2.5 4.5-5"/></svg>`,
  )}`

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

function summarise(diagnostics: Diagnostic[]) {
  let errors = 0
  let warnings = 0
  for (const d of diagnostics) {
    if (d.level === 'error') errors++
    else if (d.level === 'warning') warnings++
  }
  return { errors, warnings }
}

function describe(diagnostics: Diagnostic[]) {
  const shown = diagnostics.slice(0, MESSAGE_LIMIT).map((d) => {
    const location = d.displayFile
      ? `${d.displayFile}${d.line ? `:${d.line}:${d.column ?? 1}` : ''}: `
      : ''
    return `${location}${d.message.split('\n')[0]}`
  })
  if (diagnostics.length > MESSAGE_LIMIT) {
    shown.push(`and ${diagnostics.length - MESSAGE_LIMIT} more`)
  }
  return shown.join('\n')
}

/**
 * Register the Checker dock, its badge and one message per checker with
 * problems in a Vite DevTools context. Returns a function that removes them.
 */
export function setupDevTools(
  ctx: DevToolsContext,
  api: CheckerApi,
): () => void {
  const dock = ctx.docks.register<DevToolsViewIframe>({
    id: DOCK_ID,
    type: 'iframe',
    title: 'Checker',
    description: 'Type and lint diagnostics from vite-plugin-checker',
    icon: { light: icon('#3a3f47'), dark: icon('#d6dae0') },
    category: 'app',
    url: `${api.getUiUrl()}?embed`,
  })
  const open = {
    id: 'open',
    label: 'Open Checker',
    kind: 'activate',
    activate: { dockId: DOCK_ID },
  } as const

  const shownMessages = new Set<string>()
  const erroring = new Set<string>()
  const pending = new Set<string>()
  let scheduled = false
  let disposed = false

  const ignore = () => {}

  function syncChecker(checker: CheckerState) {
    const id = `${DOCK_ID}:${checker.id}`
    const busy = checker.status === 'checking' || checker.status === 'starting'
    const relevant = checker.diagnostics.filter((d) => d.level !== 'info')
    const { errors, warnings } = summarise(relevant)
    const hadErrors = erroring.has(checker.id)
    if (errors || checker.status === 'failed') erroring.add(checker.id)
    else erroring.delete(checker.id)

    let entry: DevToolsMessageEntryInput | undefined
    if (checker.status === 'failed') {
      entry = {
        id,
        level: 'error',
        message: `${checker.label} failed`,
        description: checker.error,
        notify: !hadErrors,
      }
    } else if (errors || warnings) {
      const parts = [
        errors && plural(errors, 'error'),
        warnings && plural(warnings, 'warning'),
      ].filter(Boolean)
      const first =
        relevant.find((d) => d.level === 'error' && d.file) ??
        relevant.find((d) => d.file)
      entry = {
        id,
        level: errors ? 'error' : 'warn',
        message: `${checker.label}: ${parts.join(', ')}`,
        description: describe(relevant),
        filePosition: first?.file
          ? { file: first.file, line: first.line, column: first.column }
          : undefined,
        status: busy ? 'loading' : 'idle',
        notify: errors > 0 && !hadErrors,
      }
    } else if (busy && shownMessages.has(id)) {
      ctx.messages.update(id, { status: 'loading' }).catch(ignore)
      return
    }

    if (entry) {
      shownMessages.add(id)
      ctx.messages
        .add({ ...entry, category: 'checker', actions: [open] })
        .catch(ignore)
    } else if (shownMessages.delete(id)) {
      ctx.messages.remove(id).catch(ignore)
    }
  }

  function flush() {
    scheduled = false
    if (disposed) return
    const checkers = api.getState()
    for (const checker of checkers) {
      if (pending.has(checker.id)) syncChecker(checker)
    }
    pending.clear()

    const totals = summarise(checkers.flatMap((checker) => checker.diagnostics))
    const problems = totals.errors + totals.warnings
    dock.update({
      badge: problems ? String(problems) : undefined,
      badgeVariant: totals.errors ? 'danger' : 'warning',
    })
  }

  function schedule(checkerId: string) {
    pending.add(checkerId)
    if (scheduled) return
    scheduled = true
    queueMicrotask(flush)
  }

  for (const checker of api.getState()) schedule(checker.id)
  const unsubscribe = api.subscribe((event) => schedule(event.checkerId))

  return () => {
    if (disposed) return
    disposed = true
    unsubscribe()
    for (const id of shownMessages) ctx.messages.remove(id).catch(ignore)
    shownMessages.clear()
  }
}
