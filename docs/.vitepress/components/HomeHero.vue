<script setup lang="ts">
import { withBase } from 'vitepress'
import { ref } from 'vue'
import HomeTerminal from './HomeTerminal.vue'

const installCommand = 'npm install -D vite-plugin-checker'
const copied = ref(false)

async function copy() {
  await navigator.clipboard.writeText(installCommand)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <section class="hero">
    <div class="info">
      <p class="eyebrow">vite-plugin-checker</p>
      <h1 class="title">Catch type errors and lint issues while Vite runs</h1>
      <p class="tagline">
        Run TypeScript, vue-tsc, svelte-check, ESLint, Biome, oxlint, and Stylelint in worker
        threads. Problems show up in your terminal and browser as you work, and a failing check
        fails <code>vite build</code>.
      </p>
      <div class="actions">
        <a class="button brand" :href="withBase('/guide/getting-started')">Get started</a>
        <a class="button alt" :href="withBase('/guide/introduction')">Why vite-plugin-checker?</a>
      </div>
      <button class="install" type="button" :aria-label="`Copy ${installCommand}`" @click="copy">
        <span class="prompt" aria-hidden="true">$</span>
        <code>{{ installCommand }}</code>
        <span class="copy-state">{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <div class="visual">
      <div class="glow" aria-hidden="true" />
      <HomeTerminal />
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  gap: 48px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 16px;
}

@media (min-width: 640px) {
  .hero {
    padding: 80px 48px 16px;
  }
}

@media (min-width: 960px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    align-items: center;
    padding: 96px 64px 32px;
  }
}

.eyebrow {
  margin: 0 0 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

@media (min-width: 640px) {
  .title {
    font-size: 48px;
  }
}

@media (min-width: 960px) {
  .title {
    font-size: 52px;
  }
}

.tagline {
  margin: 24px 0 0;
  max-width: 560px;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.tagline code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.button {
  display: inline-block;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  line-height: 38px;
  text-decoration: none;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
}

.button.brand {
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.button.brand:hover {
  background-color: var(--vp-button-brand-hover-bg);
}

.button.alt {
  background-color: var(--vp-button-alt-bg);
  color: var(--vp-button-alt-text);
}

.button.alt:hover {
  background-color: var(--vp-button-alt-hover-bg);
}

.install {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.25s;
}

.install:hover {
  border-color: var(--vp-c-brand-1);
}

.install code {
  white-space: nowrap;
}

.prompt {
  color: var(--vp-c-text-3);
}

@media (max-width: 639px) {
  .install {
    font-size: 12px;
  }

  .prompt {
    display: none;
  }
}

.copy-state {
  min-width: 56px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--vp-c-default-soft);
  font-family: var(--vp-font-family-base);
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.visual {
  position: relative;
  min-width: 0;
}

.glow {
  position: absolute;
  inset: 10% 5%;
  border-radius: 50%;
  background: linear-gradient(-45deg, var(--vp-c-brand-1) 40%, var(--vp-c-red-1) 60%);
  filter: blur(72px);
  opacity: 0.25;
}
</style>
