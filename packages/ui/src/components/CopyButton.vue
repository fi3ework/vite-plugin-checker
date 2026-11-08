<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'

const props = defineProps<{ text: () => string; label: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text())
  } catch {
    return
  }
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    copied.value = false
  }, 1500)
}

onScopeDispose(() => clearTimeout(timer))
</script>

<template>
  <button type="button" class="copy" :title="label" @click="copy">
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path v-if="copied" d="M3.5 8.5l3 3 6-7" />
      <template v-else>
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
        <path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
      </template>
    </svg>
    <span :class="{ 'visually-hidden': !$slots.default }">
      <slot>{{ label }}</slot>
    </span>
    <span class="visually-hidden" aria-live="polite">{{ copied ? 'Copied' : '' }}</span>
  </button>
</template>

<style scoped>
.copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: calc(var(--mb-radius) - 2px);
  background: none;
  color: var(--vpc-muted);
  cursor: pointer;
}
.copy:hover {
  color: var(--mb-fg);
  background: var(--vpc-raised);
}
svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
