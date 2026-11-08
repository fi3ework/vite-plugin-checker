import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, normalizePath, type Plugin } from 'vite'

const src = (file: string) =>
  normalizePath(fileURLToPath(new URL(`./src/${file}`, import.meta.url)))

const replacements: Record<string, string> = {
  [src('connection.ts')]: src('demo/connection.ts'),
  [src('editor.ts')]: src('demo/editor.ts'),
}

function demoModules(): Plugin {
  return {
    name: 'vite-plugin-checker:demo-modules',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer.startsWith(src('demo/'))) return
      const resolved = await this.resolve(source, importer, options)
      return resolved && replacements[resolved.id]
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [demoModules(), vue()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL('../../docs/public/demo', import.meta.url)),
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        overlay: src('demo/overlay.ts'),
      },
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'overlay' ? 'overlay.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
