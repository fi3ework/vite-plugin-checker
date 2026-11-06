---
layout: home
markdownStyles: false
title: vite-plugin-checker
titleTemplate: Type checking and linting for Vite
---

<script setup>
import HomeCheckers from './.vitepress/components/HomeCheckers.vue'
import HomeHero from './.vitepress/components/HomeHero.vue'
import HomeModes from './.vitepress/components/HomeModes.vue'
import HomeQuickStart from './.vitepress/components/HomeQuickStart.vue'
</script>

<HomeHero />

<HomeCheckers />

<HomeModes />

<HomeQuickStart>

::: code-group

```bash [pnpm]
pnpm add -D vite-plugin-checker typescript
```

```bash [npm]
npm install -D vite-plugin-checker typescript
```

```bash [yarn]
yarn add -D vite-plugin-checker typescript
```

```bash [bun]
bun add -d vite-plugin-checker typescript
```

:::

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
    }),
  ],
})
```

</HomeQuickStart>
