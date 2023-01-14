# Troubleshooting

This section lists a few common gotchas, and bugs introduced in the past.
Please skim through before [opening an issue](https://github.com/fi3ework/vite-plugin-checker/issues/new/choose).

## HMR Issues

### Hot Module Refresh does not work when integrating with backend

When integrating with a [traditional backend](https://vitejs.dev/guide/backend-integration.html#backend-integration), in development mode, you need to inject vite-plugin-checker's runtime manually.

```html
<!-- if development -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/main.js"></script>
<!-- add below for vite-plugin-checker -->
<script type="module" src="http://localhost:5173/@vite-plugin-checker-runtime-entry"></script>
```
