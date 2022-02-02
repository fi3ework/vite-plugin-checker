<script>
  import List from './components/List.svelte'
  export let checkerResults
</script>

<main class="window" on:click|stopPropagation>
  <List {checkerResults} />
  <div class="tip">
    Click outside or fix the code to dismiss. You can also disable this overlay by setting
    <code>config.overlay</code> to <code>false</code> in <code>vite.config.js.</code>
  </div>
</main>

<style>
  :global(:host) {
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    margin: 0;
    background: rgba(0, 0, 0, 0.66);
    --monospace: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    --red: #ff5555;
    --yellow: #e2aa53;
    --purple: #cfa4ff;
    --cyan: #2dd9da;
    --dim: #c9c9c9;
  }

  .window {
    font-family: var(--monospace);
    line-height: 1.5;
    width: 800px;
    color: #d8d8d8;
    margin: 40px auto;
    padding: 16px 32px 32px;
    position: relative;
    background: #24272e;
    border-radius: 6px 6px 8px 8px;
    box-shadow: 0 19px 38px rgba(0, 0, 0, 0.3), 0 15px 12px rgba(0, 0, 0, 0.22);
    overflow: scroll;
    direction: ltr;
    text-align: left;
    max-height: 80vh;
  }

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  .tip {
    font-size: 12px;
    color: #999;
    padding-top: 13px;
  }

  code {
    color: var(--yellow);
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
