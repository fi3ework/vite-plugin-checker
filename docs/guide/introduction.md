# Introduction

vite-plugin-checker is a Vite plugin that runs type checkers and linters while you develop and build. It reports problems in the terminal and in an overlay in the browser, so you see them without switching to another tool.

<div :style="{ display: 'flex', gap: '4px' }">
  <a href="https://www.npmjs.com/package/vite-plugin-checker"><img alt="npm version" src="https://img.shields.io/npm/v/vite-plugin-checker" /></a>
  <a href="https://www.npmtrends.com/vite-plugin-checker"><img alt="npm downloads per month" src="https://img.shields.io/npm/dm/vite-plugin-checker" /></a>
  <a href="https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/fi3ework/vite-plugin-checker/actions/workflows/ci.yml/badge.svg" /></a>
</div>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/screenshots/diagnostics-page-dark.png">
    <img alt="The vite-plugin-checker diagnostics page listing TypeScript and ESLint problems grouped by file" src="/screenshots/diagnostics-page-light.png">
  </picture>
</p>

## Why use it

Vite transpiles TypeScript without type checking it, which keeps the dev server fast. The tradeoff is that type errors only show up in your editor or when you run `tsc` yourself. Linters work the same way: Vite doesn't run them.

vite-plugin-checker closes that gap:

- **In dev mode**, each checker runs in a worker thread in watch mode. Results appear in the terminal and in the browser overlay without blocking transforms or HMR.
- **In build mode**, each checker runs its CLI in parallel with the Vite build. If a check fails, the build fails.

For details, see [Dev and build modes](/guide/dev-and-build).

## Supported checkers

| Checker                                | Option        | Checks                                     |
| -------------------------------------- | ------------- | ------------------------------------------ |
| [TypeScript](/checkers/typescript)     | `typescript`  | Types in `.ts` and `.tsx`                  |
| [vue-tsc](/checkers/vue-tsc)           | `vueTsc`      | Types in Vue single-file components        |
| [svelte-check](/checkers/svelte-check) | `svelteCheck` | Types and diagnostics in Svelte components |
| [ESLint](/checkers/eslint)             | `eslint`      | JavaScript and TypeScript lint rules       |
| [Biome](/checkers/biome)               | `biome`       | Lint and format rules                      |
| [oxlint](/checkers/oxlint)             | `oxlint`      | JavaScript and TypeScript lint rules       |
| [Stylelint](/checkers/stylelint)       | `stylelint`   | CSS lint rules                             |

You can enable several checkers at once. Each one runs independently.

## Requirements

- Node.js `^22.22.0` or `>=24.11.0`
- Vite `>=5.4.21`
- The packages for the checkers you enable, installed in your project. Each [checker page](/checkers/overview) lists what to install.

## Examples

The repository's [`playground` directory](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground) has a small project for each checker. These are a good starting point:

- [React and TypeScript](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground/typescript-react)
- [Vue and vue-tsc](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground/vue-tsc-vue3)
- [Svelte and svelte-check](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground/svelte-check-default)
- [ESLint](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground/eslint-flat)
- [TypeScript and ESLint together](https://github.com/fi3ework/vite-plugin-checker/tree/main/playground/multiple-hmr)

## Next steps

- [Getting started](/guide/getting-started): install the plugin and enable your first checker.
- [Checkers overview](/checkers/overview): compare the checkers and how to enable them.
