export const PROTOCOL_VERSION = 1

export const EVENT_HELLO = 'vite-plugin-checker:hello'
export const EVENT_SNAPSHOT = 'vite-plugin-checker:snapshot'
export const EVENT_UPDATE = 'vite-plugin-checker:update'
export const EVENT_STATUS = 'vite-plugin-checker:status'

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/** Source lines around a diagnostic */
export interface Snippet {
  /** 1-based line number of `lines[0]` */
  start: number
  lines: string[]
  /** language hint, such as `ts` or `vue` */
  lang?: string
}

export interface Diagnostic {
  /** stable across runs while the diagnostic is unchanged */
  id: string
  checkerId: string
  level: DiagnosticSeverity
  message: string
  /** rule or error code, such as `TS2322` or `no-unused-vars` */
  code?: string
  /** documentation URL for `code` */
  docsUrl?: string
  /** absolute path */
  file?: string
  /** path relative to the project root */
  displayFile?: string
  /** 1-based */
  line?: number
  /** 1-based */
  column?: number
  endLine?: number
  endColumn?: number
  snippet?: Snippet
  /** URL opened when the file is clicked, from `overlay.editorUrl` */
  editorUrl?: string
}

export type CheckerStatus = 'starting' | 'checking' | 'idle' | 'failed'

export interface CheckerRun {
  /** epoch ms */
  startedAt: number
  /** epoch ms, unset while the run is in progress */
  finishedAt?: number
}

export interface CheckerState {
  id: string
  label: string
  status: CheckerStatus
  /** reason, set only while `status` is `'failed'` */
  error?: string
  diagnostics: Diagnostic[]
  lastRun?: CheckerRun
}

export type CheckerEvent =
  | {
      type: 'status'
      checkerId: string
      status: CheckerStatus
      error?: string
      lastRun?: CheckerRun
    }
  | {
      type: 'update'
      checkerId: string
      /**
       * Diagnostics per absolute file path, with file-less diagnostics under
       * `''`. An empty array removes the key.
       */
      files: Record<string, Diagnostic[]>
    }

export interface CheckerApi {
  readonly protocol: typeof PROTOCOL_VERSION
  getState(): CheckerState[]
  /** Returns a function that removes the listener. */
  subscribe(listener: (event: CheckerEvent) => void): () => void
  /**
   * Hide the in-page badge because `owner` displays its own indicator.
   * Claims are reference-counted; the returned release function is idempotent.
   */
  claimIndicator(owner: string): () => void
  /** Root-relative URL of the diagnostics page, including Vite's `base`. */
  readonly uiUrl: string
}

export interface HelloPayload {
  protocol: number
}

export interface SnapshotPayload {
  protocol: typeof PROTOCOL_VERSION
  checkers: CheckerState[]
  indicatorClaimed: boolean
}

export type UpdatePayload = Omit<
  Extract<CheckerEvent, { type: 'update' }>,
  'type'
>
export type StatusPayload = Omit<
  Extract<CheckerEvent, { type: 'status' }>,
  'type'
>

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    [EVENT_HELLO]: HelloPayload
    [EVENT_SNAPSHOT]: SnapshotPayload
    [EVENT_UPDATE]: UpdatePayload
    [EVENT_STATUS]: StatusPayload
  }
}
