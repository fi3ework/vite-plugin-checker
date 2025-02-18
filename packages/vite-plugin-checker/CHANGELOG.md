# vite-plugin-checker

## 0.7.2

### Patch Changes

- 568b782: Added basic support for Biome
- 82972e0: fix: tweak biome configs

## 0.7.1

### Patch Changes

- 909182e: Remove extraneous non props attributes warning
- e881c44: Bump @vitejs/plugin-vue to resolve runtime warning, see #346
- 80ca69c: Resolve optionaltor from ESLint path, do not requires to install optionator anymore
- 78fc007: Throw error and hint user when vue-tsc working with typescript lower than 5.0.0
- 52423b2: sync runTsc https://github.com/volarjs/volar.js/blob/630f31118d3986c00cc730eb83cd896709fd547e/packages/typescript/lib/quickstart/runTsc.ts
- 2a0af74: refactor: reuse codeFrame helper in logger and deduplicate code
- 7d985e7: refactor: import `@volar/typescript` from `vue-tsc`

## 0.7.0

### Minor Changes

- 0747729: fix: compatibility with vue-tsc 2.x

## 0.6.4

### Patch Changes

- 83e1028: Remove lodash-es from dependencies
- b0cce16: fix: add explicitly ltr direction to the overlay

## 0.6.3

### Patch Changes

- e5a26d6: feat: support initially open overlay for errors
- bc4fa05: Remove lodash per method packages
- c5d5109: support eslint flat config

## 0.6.2

### Patch Changes

- ab70e33: fix config.overlay.panelStyle not be applied at runtime
- bad24c7: add optional global configuration of root directory (#262)

## 0.6.1

### Patch Changes

- ec4366d: use `virtual:` for virtual module
- 154ca0f: Able to resolve tsconfig when only root specified in build mode, as well as vue-tsc.
- b3e0055: Should respect `server.origin` when it's provided.
- e063617: Migrate runtime UI from svelte to vue, user should not aware this.
