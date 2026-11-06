<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    checkerResults: any[]
    collapsed: boolean
    position?: string
    badgeStyle?: string
    onClick?: () => void
  }>(),
  {
    position: 'bl',
    badgeStyle: '',
  }
)

const summary = computed(() => {
  let errorCount = 0
  let warningCount = 0
  props.checkerResults.forEach((result: any) => {
    result.diagnostics.forEach((d: any) => {
      if (d.level === 1) errorCount++
      if (d.level === 0) warningCount++
    })
  })
  return { errorCount, warningCount }
})

const bgColorClass = computed(() => {
  if (!summary.value) return ''
  if (summary.value.errorCount > 0) return 'summary-error'
  if (summary.value.warningCount > 0) return 'summary-warning'
  return 'summary-success'
})

const isCopied = ref(false)
const onCopy = async () => {
  const text = props.checkerResults
    .map((result) => {
      return result.diagnostics
        .map((d: any) => {
          return `[${result.checkerId}] ${d.message}${d.id ? ` (${d.id})` : ''}${
            d.loc ? `\n${d.loc.file}:${d.loc.line}:${d.loc.column}` : ''
          }${d.frame ? `\n${d.frame}` : ''}`
        })
        .join('\n\n')
    })
    .join('\n\n---\n\n')

  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}
</script>

<template>
  <div :class="['badge-container', `badge-${position}`]" :style="badgeStyle">
    <button v-if="!collapsed" class="badge-button copy-button" @click="onCopy">
      {{ isCopied ? 'Copied!' : 'Copy' }}
    </button>
    <button
      :class="[
        'badge-button',
        'action-button',
        collapsed ? `to-uncollpase ${bgColorClass}` : 'to-collpase',
      ]"
      @click="onClick"
    >
      <template v-if="collapsed">
        <span class="summary"><span class="emoji">❗️</span>{{ summary.errorCount }}</span>
        <span class="summary"><span class="emoji">⚠️</span>{{ summary.warningCount }}</span>
      </template>
      <template v-else>
        <span>Close</span>
      </template>
    </button>
  </div>
</template>

<style>
.badge-container {
  display: flex;
  gap: 0.5em;
  position: fixed;
  z-index: 99999;
  margin: 0.5em;
  border-radius: 0.3em;
}

.badge-button {
  appearance: none;
  font-size: 0.9em;
  font-weight: bold;
  border: 0px;
  border-radius: 0.3em;
  padding: 0.5em;
  cursor: pointer;
  color: white;
}

.copy-button {
  background: rgb(63, 78, 96);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.copy-button:hover {
  background: rgb(73, 88, 106);
}

.action-button {
  background: transparent;
}

.badge-bl {
  bottom: 0px;
  left: 0px;
}

.badge-br {
  bottom: 0px;
  right: 0px;
}

.badge-tl {
  top: 0px;
  left: 0px;
}

.badge-tr {
  top: 0px;
  right: 0px;
}

.to-collpase {
  background: rgb(63, 78, 96);
}

.to-uncollpase {
  color: white;
}

.emoji {
  margin-right: 0.5ch;
  font-family: 'apple color emoji,segoe ui emoji,noto color emoji,android emoji,emojisymbols,emojione mozilla,twemoji mozilla,segoe ui symbol';
}

.summary {
  font-family: var(--monospace);
  margin-right: 1ch;
}

.summary:last-of-type {
  margin-right: 0;
}

.summary-error {
  background: var(--red);
}

.summary-warning {
  background: var(--yellow);
}
</style>
