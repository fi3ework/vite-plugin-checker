---
layout: home

title: vite-plugin-checker
titleTemplate: Type checking and linting for Vite

hero:
  name: vite-plugin-checker
  text: Type checking and linting for Vite
  tagline: Run TypeScript, vue-tsc, svelte-check, ESLint, Biome, oxlint, and Stylelint alongside Vite, with results in your terminal and browser.
  image:
    src: /logo.png
    alt: vite-plugin-checker logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Introduction
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/fi3ework/vite-plugin-checker

features:
  - title: Doesn't block the dev server
    details: Each checker runs in its own worker thread, so type checking and linting don't slow down transforms or HMR.
  - title: Errors where you're looking
    details: Diagnostics appear in the terminal and in an overlay in the browser, with links to the source file and the rule docs.
  - title: Fails broken builds
    details: During vite build, each checker runs its CLI in parallel with bundling, and a failing check fails the build.
  - title: Works with your framework
    details: Use it with vanilla TypeScript, React, Vue, Svelte, and SSR frameworks such as Nuxt, SvelteKit, and TanStack Start.
---
