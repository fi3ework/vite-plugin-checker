import esbuild from 'esbuild'
import sveltePlugin from 'esbuild-svelte'
import hasFlag from 'has-flag'

const isWatch = hasFlag('watch')
const isLocal = hasFlag('local')

const config = isLocal
  ? {
      entryPoints: ['./src/main-local.js'],
      outfile: './public/build/bundle.js',
    }
  : {
      entryPoints: ['./src/main.js'],
      outfile: '../vite-plugin-checker/lib/@runtime/main.js',
    }

esbuild
  .build({
    entryPoints: config.entryPoints,
    bundle: true,
    format: 'esm',
    watch: isWatch,
    outfile: config.outfile,
    plugins: [sveltePlugin({ compilerOptions: { css: true } })],
    logLevel: 'info',
  })
  .catch(() => process.exit(1))
