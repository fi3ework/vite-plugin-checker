# Tailwind CSS

[eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss) reports conflicting, unknown, deprecated, and non-canonical Tailwind CSS classes. It runs as an ESLint plugin or as an oxlint JS plugin, so the [ESLint](/checkers/eslint) or [oxlint](/checkers/oxlint) checker shows its diagnostics in the overlay and terminal.

To set it up, follow these steps:

1. Install and configure the plugin for your framework by following its [quick start](https://github.com/schoero/eslint-plugin-better-tailwindcss#quick-start).
2. Enable the checker for the linter you configured it with:

   ```ts
   import { defineConfig } from 'vite'
   import checker from 'vite-plugin-checker'

   export default defineConfig({
     plugins: [
       checker({
         eslint: {
           lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
         },
         // or, if you configured it as an oxlint JS plugin:
         // oxlint: true,
       }),
     ],
   })
   ```
