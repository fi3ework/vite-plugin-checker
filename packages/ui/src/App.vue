<script setup lang="ts">
import { computed, onMounted, onScopeDispose, reactive, ref, watch } from 'vue'
import type { DiagnosticSeverity } from '../../vite-plugin-checker/src/protocol'
import CheckerPill from './components/CheckerPill.vue'
import CopyButton from './components/CopyButton.vue'
import DiagnosticGroup from './components/DiagnosticGroup.vue'
import { connect } from './connection'
import { diagnosticsToMarkdown } from './markdown'
import { loadPreferences, savePreferences } from './preferences'
import { createState, diagnosticsOf } from './state'
import { useNow } from './useNow'
import { countLevels, defaultFilters, filterDiagnostics, type GroupBy, groupDiagnostics } from './view'

const state = reactive(createState())
const preferences = reactive(loadPreferences())
const filters = preferences.filters
const now = useNow()
const search = ref<HTMLInputElement>()

watch(preferences, savePreferences, { deep: true })
onMounted(() => connect(state))

const all = computed(() => state.checkers.flatMap(diagnosticsOf))
const totals = computed(() => countLevels(all.value))
const visible = computed(() => filterDiagnostics(state.checkers, filters))
const groups = computed(() => groupDiagnostics(visible.value, state.checkers, filters.groupBy))
const busy = computed(() => state.checkers.some((c) => c.status === 'checking' || c.status === 'starting'))
const failed = computed(() => state.checkers.filter((c) => c.status === 'failed'))

const labelOf = (checkerId: string) => state.checkers.find((c) => c.id === checkerId)?.label ?? checkerId

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const summary = computed(() => {
  if (state.connection !== 'connected' || state.mismatch) return ''
  const parts = []
  if (totals.value.error) parts.push(plural(totals.value.error, 'error'))
  if (totals.value.warning) parts.push(plural(totals.value.warning, 'warning'))
  if (failed.value.length) parts.push(`${failed.value.length} failed`)
  if (parts.length) return parts.join(', ')
  return busy.value ? 'Checking' : 'No problems'
})

const levels: { level: DiagnosticSeverity; label: string }[] = [
  { level: 'error', label: 'Errors' },
  { level: 'warning', label: 'Warnings' },
  { level: 'info', label: 'Info' },
]

const groupings: { value: GroupBy; label: string }[] = [
  { value: 'file', label: 'File' },
  { value: 'checker', label: 'Checker' },
]

function toggleChecker(id: string) {
  const index = filters.hiddenCheckers.indexOf(id)
  if (index === -1) filters.hiddenCheckers.push(id)
  else filters.hiddenCheckers.splice(index, 1)
}

function toggleGroup(key: string) {
  const id = `${filters.groupBy}:${key}`
  const index = preferences.collapsed.indexOf(id)
  if (index === -1) preferences.collapsed.push(id)
  else preferences.collapsed.splice(index, 1)
}

function resetFilters() {
  const { groupBy } = filters
  Object.assign(filters, defaultFilters(), { groupBy })
  filters.levels.info = true
}

const hasHiddenInfo = computed(() => !filters.levels.info && totals.value.info > 0)

function onKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable]')) return
  event.preventDefault()
  search.value?.focus()
}

window.addEventListener('keydown', onKeydown)
onScopeDispose(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="title-row">
        <h1 class="title">
          <svg class="logo" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 2.75l7.5 3v5.5c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-5.5z" />
            <path d="M8.5 12.25l2.5 2.5 4.5-5" />
          </svg>
          Checker
        </h1>
        <div class="title-actions">
          <p class="summary" role="status">
            <span v-if="busy" class="spinner" aria-hidden="true" />
            {{ summary }}
          </p>
          <CopyButton
            v-if="visible.length"
            label="Copy visible diagnostics as Markdown"
            :text="() => diagnosticsToMarkdown(visible, labelOf)"
          />
        </div>
      </div>
      <nav v-if="state.checkers.length" class="checkers" aria-label="Checkers">
        <CheckerPill
          v-for="checker in state.checkers"
          :key="checker.id"
          :checker="checker"
          :hidden="filters.hiddenCheckers.includes(checker.id)"
          :now="now"
          @toggle="toggleChecker(checker.id)"
        />
      </nav>
    </header>

    <div v-if="state.checkers.length" class="toolbar" role="toolbar" aria-label="Filters">
      <label class="search">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5l3 3" />
        </svg>
        <span class="visually-hidden">Filter diagnostics</span>
        <input ref="search" v-model="filters.query" type="search" placeholder="Filter" @keydown.esc="filters.query = ''" />
        <kbd v-if="!filters.query" aria-hidden="true">/</kbd>
      </label>
      <div class="segmented" role="group" aria-label="Levels">
        <button
          v-for="{ level, label } in levels"
          :key="level"
          type="button"
          :class="['segment', level]"
          :aria-pressed="filters.levels[level]"
          @click="filters.levels[level] = !filters.levels[level]"
        >
          {{ label }} <span class="segment-count">{{ totals[level] }}</span>
        </button>
      </div>
      <div class="segmented" role="radiogroup" aria-label="Group by">
        <button
          v-for="{ value, label } in groupings"
          :key="value"
          type="button"
          role="radio"
          class="segment"
          :aria-checked="filters.groupBy === value"
          @click="filters.groupBy = value"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <main class="main">
      <div v-for="checker in failed" :key="checker.id" class="notice failed" role="alert">
        <strong>{{ checker.label }} failed.</strong>
        <pre v-if="checker.error" class="mono">{{ checker.error }}</pre>
      </div>

      <div v-if="state.connection === 'connecting'" class="empty">
        <span class="spinner" aria-hidden="true" /> Connecting to the dev server
      </div>
      <div v-else-if="state.connection === 'failed'" class="empty">
        <p class="empty-title">Could not connect to the dev server</p>
        <p>This page receives diagnostics over Vite's HMR connection. Check that <code class="mono">server.hmr</code> is enabled and reload.</p>
      </div>
      <div v-else-if="state.mismatch !== undefined" class="empty">
        <p class="empty-title">Version mismatch</p>
        <p>The dev server speaks protocol {{ state.mismatch }}. Restart the dev server and reload this page.</p>
      </div>
      <div v-else-if="!state.checkers.length" class="empty">
        <p class="empty-title">No checkers configured</p>
      </div>
      <div v-else-if="!all.length && !failed.length" class="empty">
        <template v-if="busy"><span class="spinner" aria-hidden="true" /> Checking</template>
        <template v-else>
          <svg class="ok" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l3 3 5-6" />
          </svg>
          <p class="empty-title">No problems found</p>
        </template>
      </div>
      <div v-else-if="!visible.length && all.length" class="empty">
        <p class="empty-title">No diagnostics match the current filters</p>
        <p v-if="hasHiddenInfo">{{ plural(totals.info, 'info diagnostic') }} hidden.</p>
        <button type="button" class="link" @click="resetFilters">Show all</button>
      </div>

      <div v-else class="groups">
        <DiagnosticGroup
          v-for="group in groups"
          :key="`${filters.groupBy}:${group.key}`"
          :group="group"
          :collapsed="preferences.collapsed.includes(`${filters.groupBy}:${group.key}`)"
          :show-file="filters.groupBy === 'checker'"
          :label-of="labelOf"
          @toggle="toggleGroup(group.key)"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  display: grid;
  gap: 10px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--vpc-line);
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.logo {
  fill: none;
  stroke: var(--mb-accent);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: -8px;
}
.summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--vpc-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.checkers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--vpc-line);
  background: color-mix(in srgb, var(--mb-bg) 92%, transparent);
  backdrop-filter: blur(8px);
}
.search {
  flex: 1 1 200px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  padding: 0 10px;
  border: 1px solid var(--vpc-line);
  border-radius: calc(var(--mb-radius) - 2px);
  background: var(--vpc-surface);
  color: var(--vpc-muted);
}
.search:focus-within {
  border-color: var(--vpc-focus);
}
.search svg {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}
.search input {
  flex: 1;
  min-width: 0;
  height: 30px;
  border: 0;
  outline: 0;
  background: none;
  color: var(--mb-fg);
}
kbd {
  padding: 0 6px;
  border: 1px solid var(--vpc-line);
  border-radius: 4px;
  font-family: var(--mb-font-mono);
  font-size: 11px;
}
.segmented {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--vpc-line);
  border-radius: calc(var(--mb-radius) - 2px);
  background: var(--vpc-surface);
}
.segment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: calc(var(--mb-radius) - 4px);
  background: none;
  color: var(--vpc-muted);
  font-size: 12.5px;
  cursor: pointer;
}
.segment:hover {
  color: var(--mb-fg);
}
.segment[aria-pressed='true'],
.segment[aria-checked='true'] {
  background: var(--vpc-raised);
  color: var(--mb-fg);
}
.segment-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.segment.error[aria-pressed='true'] .segment-count {
  color: var(--vpc-error);
}
.segment.warning[aria-pressed='true'] .segment-count {
  color: var(--vpc-warning);
}
.segment.info[aria-pressed='true'] .segment-count {
  color: var(--vpc-info);
}
.main {
  flex: 1;
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 16px 20px 32px;
}
.groups {
  display: grid;
  gap: 12px;
}
.notice {
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--vpc-error) 45%, var(--vpc-line));
  border-radius: var(--mb-radius);
  background: color-mix(in srgb, var(--vpc-error) 8%, var(--mb-bg));
}
.notice pre {
  margin: 6px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--vpc-muted);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 20px;
  color: var(--vpc-muted);
  text-align: center;
}
.empty p {
  margin: 0;
  max-width: 46ch;
}
.empty-title {
  color: var(--mb-fg);
  font-weight: 600;
}
.ok {
  fill: none;
  stroke: var(--vpc-success);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--mb-accent);
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}
</style>
