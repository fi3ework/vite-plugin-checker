# Nuxt

For type checking only, Nuxt has a built-in option. Install `vue-tsc` and `typescript`, then set [`typescript.typeCheck`](https://nuxt.com/docs/api/nuxt-config#typecheck) in your Nuxt config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  typescript: {
    typeCheck: true,
  },
})
```

Set `typeCheck: 'build'` to check types only during builds. See [Type checking](https://nuxt.com/docs/guide/concepts/typescript#type-checking) in the Nuxt documentation.

## Add vite-plugin-checker yourself

To use other checkers, such as ESLint, or to configure the type checker, add vite-plugin-checker to `vite.plugins`:

```ts
// nuxt.config.ts
import checker from 'vite-plugin-checker'

export default defineNuxtConfig({
  vite: {
    plugins: [
      checker({
        vueTsc: true,
        eslint: {
          lintCommand: 'eslint .',
        },
      }),
    ],
  },
})
```

Don't enable `typescript.typeCheck` as well, or vue-tsc runs twice.

The overlay appears on pages that Nuxt renders, with no extra setup.
