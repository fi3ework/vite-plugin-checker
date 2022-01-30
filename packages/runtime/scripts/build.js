import esbuild from 'esbuild'
import sveltePlugin from 'esbuild-svelte'
import hasFlag from 'has-flag'

const isWatch = hasFlag('watch')

esbuild
  .build({
    entryPoints: ['./src/main.js'],
    bundle: true,
    format: 'esm',
    watch: isWatch,
    outfile: '../vite-plugin-checker/lib/@runtime/main.js',
    plugins: [sveltePlugin({ compilerOptions: { css: true } })],
    logLevel: 'info',
  })
  .catch(() => process.exit(1))
