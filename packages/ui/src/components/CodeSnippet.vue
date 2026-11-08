<script setup lang="ts">
import { computed } from 'vue'
import type { Diagnostic, Snippet } from '../../../vite-plugin-checker/src/protocol'

const props = defineProps<{
  snippet: Snippet
  range: Pick<Diagnostic, 'line' | 'column' | 'endLine' | 'endColumn'>
}>()

const WORD_RE = /^[\w$]+/

function markedColumns(text: string, number: number): [number, number] | undefined {
  const { line, column, endLine, endColumn } = props.range
  if (!line || !column) return
  const last = endLine ?? line
  if (number < line || number > last) return

  const from = number === line ? column - 1 : 0
  let to: number
  if (number < last) {
    to = text.length
  } else if (endColumn && (last > line || endColumn > column)) {
    to = endColumn - 1
  } else {
    to = from + (WORD_RE.exec(text.slice(from))?.[0].length || 1)
  }
  return [Math.min(from, text.length), Math.min(Math.max(to, from), text.length)]
}

const rows = computed(() => {
  const { line, endLine } = props.range
  return props.snippet.lines.map((text, index) => {
    const number = props.snippet.start + index
    const active = !!line && number >= line && number <= (endLine ?? line)
    const columns = markedColumns(text, number)
    return {
      number,
      active,
      parts: columns
        ? [text.slice(0, columns[0]), text.slice(columns[0], columns[1]), text.slice(columns[1])]
        : [text, '', ''],
    }
  })
})

const width = computed(() => String(props.snippet.start + props.snippet.lines.length - 1).length)
</script>

<template>
  <pre class="snippet" :style="{ '--gutter': `${width}ch` }"><code><span
    v-for="row in rows"
    :key="row.number"
    :class="['row', { active: row.active }]"
  ><span class="number" aria-hidden="true">{{ row.number }}</span><span class="text">{{ row.parts[0] }}<mark v-if="row.parts[1]">{{ row.parts[1] }}</mark>{{ row.parts[2] }}</span></span></code></pre>
</template>

<style scoped>
.snippet {
  margin: 0;
  padding: 6px 0;
  overflow-x: auto;
  border: 1px solid var(--vpc-line);
  border-radius: calc(var(--mb-radius) - 2px);
  background: var(--vpc-surface);
  font-family: var(--mb-font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  tab-size: 2;
}
code {
  display: block;
  min-width: max-content;
}
.row {
  display: block;
  padding-right: 12px;
}
.row.active {
  background: color-mix(in srgb, var(--level-color, var(--vpc-error)) 10%, transparent);
  box-shadow: inset 2px 0 var(--level-color, var(--vpc-error));
}
.number {
  display: inline-block;
  width: calc(var(--gutter) + 24px);
  padding: 0 12px;
  text-align: right;
  color: var(--vpc-faint);
  user-select: none;
}
.active .number {
  color: var(--mb-fg);
}
mark {
  color: inherit;
  background: none;
  text-decoration: underline wavy var(--level-color, var(--vpc-error));
  text-decoration-skip-ink: none;
  text-underline-offset: 3px;
}
</style>
