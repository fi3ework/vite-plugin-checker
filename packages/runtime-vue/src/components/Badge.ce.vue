<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  checkerResults: any;
  collapsed: boolean
  position?: string
  badgeStyle?: string
  onClick?: () => void
}>(), {
  position: 'bl',
  badgeStyle: ''
})

const summary = computed(() => {
  let errorCount = 0
  let warningCount = 0
  props.checkerResults.forEach((result) => {
    result.diagnostics.forEach((d) => {
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



// $: calcBgColorClass = () => {
//   if (!summary) return ''
//   if (summary.errorCount > 0) return 'summary-error'
//   if (summary.warningCount > 0) return 'summary-warning'
//   return 'summary-success'
// }

// $: bgColorClass = calcBgColorClass()
</script>

<template>
  <button :class="['badge-base', collapsed ? `to-uncollpase ${bgColorClass}` : 'to-collpase', `badge-${position}`]"
    :style="badgeStyle" @click="onClick">
    <template v-if="collapsed">
      <span class="summary"><span class="emoji">❗️</span>{{ summary.errorCount }}</span>
      <span class="summary"><span class="emoji">⚠️</span>{{ summary.warningCount }}</span>
    </template>
    <template v-else>
      <span>Close</span>
    </template>
  </button>
</template>

<style>
.badge-base {
  appearance: none;
  font-size: 0.9em;
  font-weight: bold;
  border: 0px;
  border-radius: 0.3em;
  padding: 0.5em;
  cursor: pointer;
  position: fixed;
  z-index: 99999;
  margin: 0.5em;
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
  color: white;
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
