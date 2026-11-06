import type { Diagnostic } from '../../vite-plugin-checker/src/protocol'

export interface EditorLink {
  href: string
  /** opened by the browser rather than through Vite's `__open-in-editor` */
  external: boolean
}

export function editorLink(
  diagnostic: Pick<Diagnostic, 'file' | 'line' | 'column' | 'editorUrl'>,
): EditorLink | undefined {
  if (!diagnostic.file) return
  if (diagnostic.editorUrl)
    return { href: diagnostic.editorUrl, external: true }
  const position = diagnostic.line
    ? `:${diagnostic.line}:${diagnostic.column ?? 1}`
    : ''
  const file = encodeURIComponent(diagnostic.file + position)
  return {
    href: new URL(`../__open-in-editor?file=${file}`, location.href).href,
    external: false,
  }
}

export function openEditorLink(event: MouseEvent, link: EditorLink) {
  if (link.external) return
  event.preventDefault()
  fetch(link.href).catch(() => {})
}
