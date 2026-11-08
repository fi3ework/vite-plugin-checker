import {
  type CheckerRun,
  type CheckerStatus,
  type Diagnostic,
  PROTOCOL_VERSION,
  type SnapshotPayload,
  type StatusPayload,
  type UpdatePayload,
} from '../../vite-plugin-checker/src/protocol'

export interface CheckerView {
  id: string
  label: string
  status: CheckerStatus
  error?: string
  lastRun?: CheckerRun
  files: Record<string, Diagnostic[]>
}

export interface State {
  connection: 'connecting' | 'connected' | 'failed'
  /** protocol version reported by the dev server, when it differs from ours */
  mismatch?: number
  indicatorClaimed: boolean
  checkers: CheckerView[]
}

export function createState(): State {
  return { connection: 'connecting', indicatorClaimed: false, checkers: [] }
}

function groupByFile(diagnostics: Diagnostic[]) {
  const files: Record<string, Diagnostic[]> = {}
  for (const diagnostic of diagnostics) {
    const file = diagnostic.file ?? ''
    files[file] ??= []
    files[file].push(diagnostic)
  }
  return files
}

export function applySnapshot(state: State, snapshot: SnapshotPayload) {
  state.connection = 'connected'
  if (snapshot.protocol !== PROTOCOL_VERSION) {
    state.mismatch = snapshot.protocol
    state.checkers = []
    return
  }
  delete state.mismatch
  state.indicatorClaimed = snapshot.indicatorClaimed
  state.checkers = snapshot.checkers.map(({ diagnostics, ...checker }) => ({
    ...checker,
    files: groupByFile(diagnostics),
  }))
}

export function applyUpdate(state: State, { checkerId, files }: UpdatePayload) {
  const checker = state.checkers.find((c) => c.id === checkerId)
  if (!checker) return
  const next = { ...checker.files }
  for (const [file, diagnostics] of Object.entries(files)) {
    if (diagnostics.length) next[file] = diagnostics
    else delete next[file]
  }
  checker.files = next
}

export function applyStatus(state: State, payload: StatusPayload) {
  const checker = state.checkers.find((c) => c.id === payload.checkerId)
  if (!checker) return
  checker.status = payload.status
  if (payload.error === undefined) delete checker.error
  else checker.error = payload.error
  if (payload.lastRun) checker.lastRun = payload.lastRun
}

export function diagnosticsOf(checker: CheckerView): Diagnostic[] {
  return Object.values(checker.files).flat()
}
