<script setup lang="ts">
import { computed } from 'vue'
const { diagnostic, base } = defineProps<{
  diagnostic: any
  base: string
}>()

const checkerColorMap: Record<string, string> = {
  TypeScript: '#3178c6',
  ESLint: '#7b7fe3',
  Biome: '#60a5fa',
  'vue-tsc': '#64b587',
  Stylelint: '#ffffff',
  'oxlint': '#a8b1ff',
  'svelte-check': '#ff3e00'
} as const

const codeFrameRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm

const hasFrame = computed(() => {
  codeFrameRE.lastIndex = 0
  return diagnostic.frame && codeFrameRE.test(diagnostic.frame)
})

const fileLink = computed(() => {
  const file: string | undefined = (diagnostic.loc?.file || diagnostic.id)?.split('?')[0]
  if (!file) return

  const position = diagnostic.loc ? `:${diagnostic.loc.line}:${diagnostic.loc.column}` : ''
  return {
    file: file + position,
    label: (diagnostic.relativeFile || file) + position,
    href:
      diagnostic.editorUrl || `${base}__open-in-editor?file=${encodeURIComponent(file + position)}`,
  }
})

const ruleLink = computed(() => {
  const { message, rule, ruleUrl } = diagnostic
  if (!message || !rule || !ruleUrl) return
  const index = message.lastIndexOf(rule)
  if (index === -1) return

  return {
    before: message.slice(0, index),
    rule,
    after: message.slice(index + rule.length),
    href: ruleUrl,
  }
})

function openInEditor(event: MouseEvent) {
  if (diagnostic.editorUrl || !fileLink.value) return
  event.preventDefault()
  fetch(fileLink.value.href)
}
</script>

<template>
  <li class="message-item">
    <pre class="message">
    <!-- @vue-ignore -->
    <span class="plugin" :style="{ color: checkerColorMap[diagnostic.checkerId] }"
      >{{ `[${diagnostic.checkerId}]` }} </span
    ><span :class="['message-body', `message-body-${diagnostic.level}`]"><template v-if="ruleLink">{{ ruleLink.before }}<a class="rule-link" :href="ruleLink.href" target="_blank" rel="noopener noreferrer">{{ ruleLink.rule }}</a>{{ ruleLink.after }}</template><template v-else>{{ diagnostic.message }}</template></span>
  </pre>
    <pre v-if="fileLink" class="file"><a
      class="file-link"
      :href="fileLink.href"
      :title="fileLink.file"
      @click="openInEditor"
    >{{ fileLink.label }}</a></pre>
    <pre v-if="hasFrame" class="frame"><code class="frame-code">{{ diagnostic.frame }}</code></pre>
    <pre class="stack">{{ diagnostic.stack }}</pre>
  </li>
</template>

<style>
li {
  list-style: none;
}

.message-item {
  border-bottom: 1px dotted #666;
  padding: 12px 0 0 0;
}

.message {
  white-space: initial;
  font-weight: 600;
}

pre {
  font-family: var(--monospace);
  font-size: 14px;
  margin-top: 0;
  margin-bottom: 0;
  overflow-x: scroll;
  scrollbar-width: none;
}

.frame {
  margin: 1em 0;
  padding: 6px 8px;
  background: rgba(22, 24, 29, 0.85);
  margin-top: 8px;
  border-radius: 8px;
}

.frame-code {
  color: var(--yellow);
  font-family: var(--monospace);
}

pre::-webkit-scrollbar {
  display: none;
}

.message-body {
  color: var(--red);
}

/* warning */
.message-body-0 {
  color: var(--yellow);
}

/* error */
.message-body-1 {
  color: var(--red);
}

/* suggestion */
.message-body-2 {
  color: var(--blue);
}

/* message */
.message-body-3 {
  color: var(--dim);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.rule-link {
  color: inherit;
}

.file-link {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
