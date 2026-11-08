<script setup lang="ts">
import { demoPage as page, useOverlayDemo } from '../demo'

const { running, loading, start, stop } = useOverlayDemo()

function toggle() {
  if (running.value) stop()
  else start()
}
</script>

<template>
  <div class="demo">
    <button class="button" type="button" :aria-pressed="running" :disabled="loading" @click="toggle">
      {{ running ? 'Stop the demo' : 'Try the overlay' }}
    </button>
    <p class="hint">
      Replays a short dev session with TypeScript and ESLint on this page. You can also open the
      <a :href="page" target="_blank" rel="noopener">diagnostics page</a> on its own.
    </p>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin: 16px 0;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}
.button {
  padding: 0 16px;
  border-radius: 20px;
  background-color: var(--vp-c-brand-3);
  color: var(--vp-c-white);
  font-size: 14px;
  font-weight: 600;
  line-height: 38px;
  transition: background-color 0.25s;
}
.button:hover {
  background-color: var(--vp-c-brand-2);
}
.hint {
  flex: 1 1 260px;
  margin: 0 !important;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
</style>
