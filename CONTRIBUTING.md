# CONTRIBUTING

## Development

```bash
pnpm i
pnpm build
pnpm dev
```

## Release

`cd` to `packages/vite-plugin-checker`.

Release with interactive CLI

```bash
npm run release
```

or release with an explicit version or dry run flag

```bash
npm run release -- --version=1.2.3 --dry
```

## Publish

Package is automated published in CI, see `.github/workflows/release.yml`.
