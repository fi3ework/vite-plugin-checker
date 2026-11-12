# Contributing

## Development

This repository uses pnpm. The version is pinned in `package.json`; [corepack](https://github.com/nodejs/corepack) installs it for you.

```bash
corepack enable
pnpm install
pnpm build
pnpm dev
```

## Tests

```bash
# Unit tests and playground end-to-end tests
pnpm test

# Lint and type check
pnpm lint
pnpm type-check
```

The playground tests need Chromium. Install it once with `pnpm exec playwright install chromium`.

## `sv` add-on

`npx sv add vite-plugin-checker` runs the [community add-on](https://svelte.dev/docs/cli/sv-add) in `packages/vite-plugin-checker/src/sv.ts`, published as the package's `./sv` export. The [official add-ons](https://github.com/sveltejs/cli/tree/main/packages/sv/src/addons) are useful references.

`sv` installs the package without its `dependencies`, so `dist/sv.js` bundles everything except the `sv` peer dependency.

```bash
cd packages/vite-plugin-checker

# Create a minimal project in demo/, then build and apply the add-on to it
pnpm demo-create
pnpm demo-add

# Run the add-on tests
pnpm -w exec vitest run --project sv
```

## Documentation

The documentation site lives in `docs` and uses VitePress:

```bash
pnpm docs:dev
```

## Publishing

CI publishes the package. See `.github/workflows/release.yml`.
