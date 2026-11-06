<script setup lang="ts">
import type { DiagnosticSeverity } from '../../../vite-plugin-checker/src/protocol'

defineProps<{ level: DiagnosticSeverity }>()
</script>

<template>
  <svg
    :class="['level-icon', level]"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <template v-if="level === 'error'">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" />
    </template>
    <template v-else-if="level === 'warning'">
      <path d="M8 1.75l6.5 12H1.5z" />
      <path d="M8 6.25v3.5M8 11.75v.01" />
    </template>
    <template v-else>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.25v4M8 4.75v.01" />
    </template>
  </svg>
</template>

<style scoped>
.level-icon {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.error {
  color: var(--vpc-error);
}
.warning {
  color: var(--vpc-warning);
}
.info {
  color: var(--vpc-info);
}
</style>
