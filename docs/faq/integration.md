# Integration

## with traditional backend (require version >= 0.5.4)

### overlay does not display in development mode

When integrating with a [traditional backend](https://vitejs.dev/guide/backend-integration.html#backend-integration), in development mode, you need to inject vite-plugin-checker's runtime manually.

```html
<!-- if development -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/main.js"></script>
<!-- add below for vite-plugin-checker -->
<script type="module" src="http://localhost:5173/@vite-plugin-checker-runtime-entry"></script>
```

## with Nuxt3

### overlay does not display in development mode

There're two ways to use vite-plugin-checker with Nuxt3 for now.

#### Use vite-plugin-checker as a normal Vite plugin (require version >= 0.5.5)

There are a few steps to do:

1. Add `vite-plugin-checker` `typescript` `vue-tsc` `@types/node` as devDependencies to your Nuxt project.
2. Create a Vue component with content:
   ```vue
   // vite-plugin-checker.vue
   <script setup>
   import('/@vite-plugin-checker-runtime-entry')
   </script>
   ```
3. Import component above in the root component of your Nuxt project to have a global error overlay.

   ```vue
   <script setup lang="ts">
   import Vpc from './vite-plugin-checker.vue'
   </script>

   <template>
     <!-- your app code -->
     <DevOnly>
       <ClientOnly>
         <Vpc />
       </ClientOnly>
     </DevOnly>
   </template>
   ```

#### Enable vite-plugin-checker as a built-in Nuxt functionality

::: warning
The error overlay can not be displayed in this way, we'll try to fix this with Nuxt in the future.
:::

See Nuxt's official documentation's [typecheck section](https://nuxt.com/docs/api/commands/typecheck#nuxi-typecheck).
