# CONTRIBUTING

## Development

```bash
# fork
# git clone
# cd vite-plugin-checker
pnpm i
pnpm build
pnpm dev
```

## Release

cd to `packages/vite-plugin-checker`.

Release with interactive CLI

```bash
npm run release
```

or release with an explicit version

```bash
npm run release -- --version=1.2.3
```

## Publish

Publish in @latest dist tag

```bash
npm run ci:publish
```

Or publish in other dist tag

```bash
npm run ci:publish -- dist-tag=beta
```
