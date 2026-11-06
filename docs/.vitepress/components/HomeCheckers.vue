<script setup lang="ts">
import {
  siBiome,
  siEslint,
  siOxc,
  siStylelint,
  siSvelte,
  siTypescript,
  siVuedotjs,
} from 'simple-icons'
import { withBase } from 'vitepress'

const checkers = [
  {
    name: 'TypeScript',
    option: 'typescript: true',
    description: 'Types in .ts and .tsx files',
    link: '/checkers/typescript',
    icon: siTypescript,
  },
  {
    name: 'vue-tsc',
    option: 'vueTsc: true',
    description: 'Types in Vue components',
    link: '/checkers/vue-tsc',
    icon: siVuedotjs,
  },
  {
    name: 'svelte-check',
    option: 'svelteCheck: true',
    description: 'Types and diagnostics in Svelte components',
    link: '/checkers/svelte-check',
    icon: siSvelte,
  },
  {
    name: 'ESLint',
    option: "eslint: { lintCommand: 'eslint .' }",
    description: 'JavaScript and TypeScript lint rules',
    link: '/checkers/eslint',
    icon: siEslint,
  },
  {
    name: 'Biome',
    option: 'biome: true',
    description: 'Lint and format rules',
    link: '/checkers/biome',
    icon: siBiome,
  },
  {
    name: 'oxlint',
    option: 'oxlint: true',
    description: 'JavaScript and TypeScript lint rules',
    link: '/checkers/oxlint',
    icon: siOxc,
    color: '#00C2BD',
  },
  {
    name: 'Stylelint',
    option: "stylelint: { lintCommand: 'stylelint ...' }",
    description: 'CSS lint rules',
    link: '/checkers/stylelint',
    icon: siStylelint,
    color: 'var(--vp-c-text-1)',
  },
]
</script>

<template>
  <section class="section">
    <div class="header">
      <h2 class="heading">Use the tools you already have</h2>
      <p class="lead">
        Each checker wraps an existing tool and reads its usual config file, so results match your
        editor and CI. Enable as many as you need.
      </p>
    </div>
    <div class="grid">
      <a v-for="checker in checkers" :key="checker.name" class="card" :href="withBase(checker.link)">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" :style="{ color: checker.color ?? `#${checker.icon.hex}` }">
          <path :d="checker.icon.path" fill="currentColor" />
        </svg>
        <span class="name">{{ checker.name }}</span>
        <span class="description">{{ checker.description }}</span>
        <code class="option">{{ checker.option }}</code>
      </a>
      <a class="card more" :href="withBase('/checkers/overview')">
        <span class="name">Compare checkers</span>
        <span class="description">See what each one needs and how it runs in dev and build.</span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 64px 24px;
}

@media (min-width: 640px) {
  .section {
    padding: 64px 48px;
  }
}

@media (min-width: 960px) {
  .section {
    padding: 80px 64px;
  }
}

.header {
  max-width: 640px;
  margin-bottom: 40px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (min-width: 960px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.25s;
}

.card:hover {
  border-color: var(--vp-c-brand-1);
}

@media (min-width: 640px) {
  .card {
    padding: 20px;
  }
}

.icon {
  width: 28px;
  height: 28px;
  margin-bottom: 8px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.description {
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.option {
  margin-top: auto;
  padding-top: 12px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more {
  justify-content: center;
  border-style: dashed;
  border-color: var(--vp-c-divider);
  background-color: transparent;
}

.arrow {
  margin-top: 8px;
  font-size: 20px;
  color: var(--vp-c-brand-1);
}
</style>
