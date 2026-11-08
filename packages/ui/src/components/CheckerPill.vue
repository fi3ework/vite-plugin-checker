<script setup lang="ts">
import { computed } from 'vue'
import { type CheckerView, diagnosticsOf } from '../state'
import { formatAgo } from '../useNow'
import { countLevels } from '../view'

const props = defineProps<{
  checker: CheckerView
  hidden: boolean
  now: number
}>()

defineEmits<{ toggle: [] }>()

const counts = computed(() => countLevels(diagnosticsOf(props.checker)))
const busy = computed(() => props.checker.status === 'checking' || props.checker.status === 'starting')

const tone = computed(() => {
  if (props.checker.status === 'failed' || counts.value.error) return 'error'
  if (busy.value) return 'busy'
  if (counts.value.warning) return 'warning'
  return 'ok'
})

const description = computed(() => {
  const { status, error, lastRun } = props.checker
  if (status === 'failed') return `Failed: ${error ?? 'unknown error'}`
  if (busy.value) return 'Checking'
  if (lastRun?.finishedAt) return `Checked ${formatAgo(lastRun.finishedAt, props.now)}`
  return 'Idle'
})
</script>

<template>
  <button
    type="button"
    :class="['pill', `tone-${tone}`, { hidden, failed: checker.status === 'failed' }]"
    :aria-pressed="!hidden"
    :title="`${description}. ${hidden ? 'Show' : 'Hide'} ${checker.label} diagnostics.`"
    @click="$emit('toggle')"
  >
    <span v-if="busy" class="spinner state" aria-hidden="true" />
    <svg v-else class="state" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path v-if="checker.status === 'failed'" d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
      <path v-else-if="counts.error || counts.warning" d="M8 3.5v5.5M8 12.25v.01" />
      <path v-else d="M3.5 8.5l3 3 6-7" />
    </svg>
    <span class="label">{{ checker.label }}</span>
    <span v-if="checker.status === 'failed'" class="failed-label">failed</span>
    <template v-else>
      <span v-if="counts.error" class="count error">{{ counts.error }}</span>
      <span v-if="counts.warning" class="count warning">{{ counts.warning }}</span>
    </template>
    <span class="visually-hidden">
      {{ counts.error }} errors, {{ counts.warning }} warnings. {{ description }}.
    </span>
  </button>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border: 1px solid var(--vpc-line);
  border-radius: 999px;
  background: var(--vpc-surface);
  font-size: 12.5px;
  cursor: pointer;
  --state-color: var(--vpc-success);
}
.pill:hover {
  background: var(--vpc-raised);
}
.pill.hidden {
  opacity: 0.5;
  border-style: dashed;
}
.tone-error {
  --state-color: var(--vpc-error);
}
.tone-warning {
  --state-color: var(--vpc-warning);
}
.tone-busy {
  --state-color: var(--vpc-muted);
}
.pill.failed {
  border-color: color-mix(in srgb, var(--vpc-error) 50%, var(--vpc-line));
}
.state {
  color: var(--state-color);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.label {
  font-weight: 500;
}
.failed-label {
  color: var(--vpc-error);
}
.count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.count.error {
  color: var(--vpc-error);
}
.count.warning {
  color: var(--vpc-warning);
}
</style>
