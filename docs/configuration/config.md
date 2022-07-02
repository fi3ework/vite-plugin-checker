# Configurations

Below is the shared configuration to control the behaviors of the plugin.

```ts
{
  /**
   * Show overlay on UI view when there are errors or warnings in dev mode.
   * - Set `true` to show overlay
   * - Set `false` to disable overlay
   * - Set with a object to customize overlay
   *
   * @defaultValue `true`
   */
  overlay:
    | boolean
    | {
        /**
         * Set this true if you want the overlay to default to being open if errors/warnings are found
         * @defaultValue `true`
         */
        initialIsOpen?: boolean
        /**
         * The position of the vite-plugin-checker badge to open and close the diagnostics panel
         * @default `bl`
         */
        position?: 'tl' | 'tr' | 'bl' | 'br'
        /**
         * Use this to add extra style to the badge button, see details of [Svelte style](https://svelte.dev/docs#template-syntax-element-directives-style-property)
         * For example, if you want to hide the badge, you can pass `display: none;` to the badgeStyle property
         */
        badgeStyle?: string
      }
  /**
   * stdout in terminal which starts the Vite server in dev mode.
   * - Set `true` to enable
   * - Set `false` to disable
   *
   * @defaultValue `true`
   */
  terminal: boolean
  /**
   * Enable checking in build mode
   * @defaultValue `true`
   */
  enableBuild: boolean
}
```
