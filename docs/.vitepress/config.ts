import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'vite-plugin-checker',
  description: 'Vite plugin that provide checks of TypeScript, ESLint, Biome, vue-tsc, and more.',
  lastUpdated: true,
  themeConfig: {
    outline: 'deep',
    sidebar: {
      '/': sidebar(),
    },
    editLink: {
      pattern: 'https://github.com/fi3ework/vite-plugin-checker/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fi3ework/vite-plugin-checker' },
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

function sidebar() {
  return [
    {
      text: 'Introduction',
      collapsible: true,
      items: [
        { text: 'Introduction', link: '/introduction/introduction' },
        { text: 'Getting Started', link: '/introduction/getting-started' },
      ],
    },
    {
      text: 'Checkers',
      collapsible: true,
      items: [
        { text: 'Overview', link: '/checkers/overview' },
        { text: 'TypeScript', link: '/checkers/typescript' },
        { text: 'vue-tsc', link: '/checkers/vue-tsc' },
        { text: 'ESLint', link: '/checkers/eslint' },
        { text: 'Biome', link: '/checkers/biome' },
        { text: 'Stylelint', link: '/checkers/stylelint' },
        { text: 'VLS', link: '/checkers/vls' },
      ],
    },
    {
      text: 'Configuration',
      collapsible: true,
      items: [{ text: 'Shared ', link: '/configuration/config' }],
    },
    {
      text: 'FAQs',
      collapsible: true,
      items: [{ text: 'Integration', link: '/faq/integration' }],
    },
  ]
}
