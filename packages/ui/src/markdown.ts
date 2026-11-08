import type { Diagnostic } from '../../vite-plugin-checker/src/protocol'

function fence(text: string) {
  const longest = Math.max(2, ...(text.match(/`+/g) ?? []).map((m) => m.length))
  return '`'.repeat(longest + 1)
}

export function diagnosticToMarkdown(
  diagnostic: Diagnostic,
  label: string,
): string {
  const heading = [
    `**${diagnostic.level}**`,
    diagnostic.code &&
      (diagnostic.docsUrl
        ? `[\`${diagnostic.code}\`](${diagnostic.docsUrl})`
        : `\`${diagnostic.code}\``),
    `(${label})`,
  ]
    .filter(Boolean)
    .join(' ')

  const location = diagnostic.displayFile
    ? `\`${diagnostic.displayFile}${diagnostic.line ? `:${diagnostic.line}:${diagnostic.column ?? 1}` : ''}\``
    : undefined

  const parts = [heading, location, diagnostic.message].filter(Boolean)

  const { snippet } = diagnostic
  if (snippet) {
    const width = String(snippet.start + snippet.lines.length - 1).length
    const code = snippet.lines
      .map((line, index) => {
        const number = snippet.start + index
        const marker =
          diagnostic.line &&
          number >= diagnostic.line &&
          number <= (diagnostic.endLine ?? diagnostic.line)
            ? '>'
            : ' '
        return `${marker} ${String(number).padStart(width)} | ${line}`
      })
      .join('\n')
    const ticks = fence(code)
    parts.push(`${ticks}${snippet.lang ?? ''}\n${code}\n${ticks}`)
  }

  return parts.join('\n\n')
}

export function diagnosticsToMarkdown(
  diagnostics: Diagnostic[],
  labelOf: (checkerId: string) => string,
): string {
  return diagnostics
    .map((d) => diagnosticToMarkdown(d, labelOf(d.checkerId)))
    .join('\n\n---\n\n')
}
