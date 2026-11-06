# Vitest

Vitest loads your Vite config, including its plugins. With vite-plugin-checker in the config, every test run also starts the checkers, which slows the run down and mixes checker output with test results.

To skip the checkers in Vitest, leave the plugin out when the `VITEST` environment variable is set:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [!process.env.VITEST && checker({ typescript: true })],
})
```

Vite ignores `false` entries in `plugins`.
