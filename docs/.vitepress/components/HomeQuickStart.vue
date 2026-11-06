<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="section">
    <div class="intro">
      <h2 class="heading">Set it up</h2>
      <p class="lead">
        Install the plugin with the tools you want to run, then enable them in your Vite config.
      </p>
      <p class="lead">
        Using Nuxt, Vitest, or a backend framework? See the
        <a :href="withBase('/recipes/nuxt')">recipes</a>.
      </p>
      <a class="button" :href="withBase('/guide/getting-started')">Read the guide</a>
    </div>
    <div class="code vp-doc">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.section {
  display: grid;
  gap: 32px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 640px) {
  .section {
    padding: 0 48px;
  }
}

@media (min-width: 960px) {
  .section {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    align-items: center;
    gap: 64px;
    padding: 0 64px;
  }
}

.heading {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.lead {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.lead a {
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.button {
  display: inline-block;
  margin-top: 24px;
  padding: 0 20px;
  border-radius: 20px;
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 38px;
  text-decoration: none;
  transition: background-color 0.25s;
}

.button:hover {
  background-color: var(--vp-button-brand-hover-bg);
}

.code {
  min-width: 0;
}

.code :deep(div[class*='language-']),
.code :deep(.vp-code-group) {
  margin: 0;
}

.code :deep(.vp-code-group) {
  margin-bottom: 16px;
}

@media (max-width: 639px) {
  .code :deep(div[class*='language-']),
  .code :deep(.vp-code-group .tabs) {
    margin: 0 -24px;
  }
}
</style>
