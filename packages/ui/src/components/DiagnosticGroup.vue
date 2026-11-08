<script setup lang="ts">
import { computed } from 'vue'
import { type Group, countLevels } from '../view'
import DiagnosticItem from './DiagnosticItem.vue'

const props = defineProps<{
  group: Group
  /** number of diagnostics to render */
  shown: number
  collapsed: boolean
  showFile: boolean
  labelOf: (checkerId: string) => string
}>()

defineEmits<{ toggle: [] }>()

const counts = computed(() => countLevels(props.group.diagnostics))
const diagnostics = computed(() => props.group.diagnostics.slice(0, props.shown))
const id = computed(() => `group-${encodeURIComponent(props.group.key)}`)
</script>

<template>
  <section class="group">
    <h2 class="header">
      <button
        type="button"
        class="toggle"
        :aria-expanded="!collapsed"
        :aria-controls="id"
        @click="$emit('toggle')"
      >
        <svg class="chevron" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M6 4l4 4-4 4" />
        </svg>
        <span :class="['title', { mono: group.file }]">{{ group.title }}</span>
        <span class="counts">
          <span v-if="counts.error" class="count error">{{ counts.error }}<span class="visually-hidden"> errors</span></span>
          <span v-if="counts.warning" class="count warning">{{ counts.warning }}<span class="visually-hidden"> warnings</span></span>
          <span v-if="counts.info" class="count info">{{ counts.info }}<span class="visually-hidden"> info</span></span>
        </span>
      </button>
    </h2>
    <ul v-show="!collapsed" :id="id" class="list">
      <DiagnosticItem
        v-for="diagnostic in diagnostics"
        :key="diagnostic.id"
        :diagnostic="diagnostic"
        :label="labelOf(diagnostic.checkerId)"
        :show-file="showFile"
      />
    </ul>
  </section>
</template>

<style scoped>
.group {
  border: 1px solid var(--vpc-line);
  border-radius: var(--mb-radius);
  background: var(--mb-bg);
  overflow: hidden;
}
.header {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border: 0;
  background: var(--vpc-surface);
  text-align: left;
  cursor: pointer;
}
.toggle:hover {
  background: var(--vpc-raised);
}
.chevron {
  flex: none;
  fill: none;
  stroke: var(--vpc-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.12s;
}
.toggle[aria-expanded='true'] .chevron {
  transform: rotate(90deg);
}
.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.title.mono {
  font-weight: 500;
}
.counts {
  display: flex;
  gap: 6px;
}
.count {
  min-width: 22px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.count.error {
  color: var(--vpc-error);
  background: color-mix(in srgb, var(--vpc-error) 14%, transparent);
}
.count.warning {
  color: var(--vpc-warning);
  background: color-mix(in srgb, var(--vpc-warning) 14%, transparent);
}
.count.info {
  color: var(--vpc-info);
  background: color-mix(in srgb, var(--vpc-info) 14%, transparent);
}
.list {
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
