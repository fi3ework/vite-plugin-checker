# @vite-plugin-checker/runtime

Runtime code for vite-plugin-checker, this package will be directly bundled into the vite-plugin-checker package in building process and hasn't be released to NPM for now.

## Development

### local

Watch and compile code with mock diagnostics and html without vite-plugin-checker.

```sh
pnpm dev-local
pnpm preview
```

### with vite-plugin-checker

Watch and compile bundled JS to `../vite-plugin-checker/lib/@runtime/main.js`. Run `pnpm dev` in monorepo root will invoke below scripts.

```sh
pnpm dev
```
