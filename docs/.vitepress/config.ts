import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'vite-plugin-checker',
  description:
    'Run TypeScript, vue-tsc, svelte-check, ESLint, Biome, oxlint, and Stylelint alongside Vite, with results in your terminal and browser.',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/logo.png' }]],
  themeConfig: {
    logo: '/logo.png',
    outline: 'deep',
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Checkers', link: '/checkers/overview' },
      { text: 'Options', link: '/reference/shared-options' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Dev and build modes', link: '/guide/dev-and-build' },
          { text: 'Overlay and terminal', link: '/guide/overlay' },
          { text: 'Migrating to v1', link: '/guide/migration' },
        ],
      },
      {
        text: 'Checkers',
        items: [
          { text: 'Overview', link: '/checkers/overview' },
          { text: 'TypeScript', link: '/checkers/typescript' },
          { text: 'vue-tsc', link: '/checkers/vue-tsc' },
          { text: 'svelte-check', link: '/checkers/svelte-check' },
          { text: 'ESLint', link: '/checkers/eslint' },
          { text: 'Biome', link: '/checkers/biome' },
          { text: 'oxlint', link: '/checkers/oxlint' },
          { text: 'Stylelint', link: '/checkers/stylelint' },
        ],
      },
      {
        text: 'Reference',
        items: [{ text: 'Shared options', link: '/reference/shared-options' }],
      },
      {
        text: 'Recipes',
        items: [
          {
            text: 'Backend integration and SSR',
            link: '/recipes/backend-integration',
          },
          { text: 'Nuxt', link: '/recipes/nuxt' },
          { text: 'Vitest', link: '/recipes/vitest' },
          { text: 'Tailwind CSS', link: '/recipes/tailwind-css' },
        ],
      },
    ],
    editLink: {
      pattern:
        'https://github.com/fi3ework/vite-plugin-checker/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/fi3ework/vite-plugin-checker',
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/vite-plugin-checker',
      },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright fi3ework',
    },
  },
})
