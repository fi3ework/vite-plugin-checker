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

## Documentation

The documentation site lives in `docs` and uses VitePress:

```bash
pnpm docs:dev
```

## Publishing

CI publishes the package. See `.github/workflows/release.yml`.
