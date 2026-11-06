<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="section">
    <div class="grid">
      <div class="mode">
        <p class="command"><span class="prompt" aria-hidden="true">$</span> vite</p>
        <h2 class="heading">While you develop</h2>
        <ul class="points">
          <li>
            <strong>Doesn't slow Vite down.</strong> Each checker runs in its own worker thread, in
            watch mode, so transforms and HMR stay fast.
          </li>
          <li>
            <strong>Shows problems where you're looking.</strong> Diagnostics appear in the terminal
            and in an overlay in the browser, including on pages rendered by SSR frameworks.
          </li>
          <li>
            <strong>Takes you to the fix.</strong> Click a location to open it in your editor, or a
            rule name to read its docs.
          </li>
        </ul>
        <a class="more" :href="withBase('/guide/overlay')">Overlay and terminal →</a>
      </div>
      <div class="mode">
        <p class="command"><span class="prompt" aria-hidden="true">$</span> vite build</p>
        <h2 class="heading">When you build</h2>
        <ul class="points">
          <li>
            <strong>Runs the same checks as CI.</strong> Each checker runs its own CLI, such as
            <code>tsc</code> or <code>eslint</code>, with your config.
          </li>
          <li>
            <strong>Runs alongside bundling.</strong> Checks start with the build and run in
            parallel with it.
          </li>
          <li>
            <strong>Fails broken builds.</strong> If a check fails, the build exits with its exit
            code. Set <code>enableBuild: false</code> to check in dev only.
          </li>
        </ul>
        <a class="more" :href="withBase('/guide/dev-and-build')">Dev and build modes →</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

@media (min-width: 640px) {
  .section {
    padding: 0 48px 64px;
  }
}

@media (min-width: 960px) {
  .section {
    padding: 0 64px 80px;
  }
}

.grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

.mode {
  display: flex;
  flex-direction: column;
  padding: 32px;
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
}

.command {
  margin: 0 0 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.prompt {
  color: var(--vp-c-text-3);
}

.heading {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--vp-c-text-1);
}

.points {
  display: grid;
  gap: 12px;
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.points strong {
  color: var(--vp-c-text-1);
}

.points code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875em;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.more {
  margin-top: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.more:hover {
  text-decoration: underline;
}
</style>
