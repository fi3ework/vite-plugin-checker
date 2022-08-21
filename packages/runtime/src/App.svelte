<script>
  import List from './components/List.svelte'
  import Badge from './components/Badge.svelte'
  export let overlayConfig = {}
  export let checkerResults
  export let base

  const initialIsOpen = overlayConfig?.initialIsOpen ?? true
  $: collapsed = !initialIsOpen
  const toggle = () => {
    collapsed = !collapsed
  }
</script>

<Badge
  {checkerResults}
  {collapsed}
  position={overlayConfig.position}
  badgeStyle={overlayConfig.badgeStyle}
  onClick={toggle}
/>
<main
  class={`window ${collapsed ? 'window-collapsed' : ''}`}
  on:click|stopPropagation
  style={overlayConfig.panelStyle}
>
  <div class="list-scroll">
    <List {checkerResults} {base} ulStyle="margin-bottom: 36px;" />
  </div>
</main>

<style>
  :global(:host) {
    --monospace: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    --red: #ff5555;
    --yellow: #e2aa53;
    --purple: #cfa4ff;
    --blue: #a4c1ff;
    --cyan: #2dd9da;
    --dim: #c9c9c9;
  }

  .window {
    font-family: sans-serif;
    background-color: rgba(11, 21, 33, 0.85);
    backdrop-filter: blur(1px);
    color: white;
    position: fixed;
    bottom: 0px;
    right: 0px;
    z-index: 99998;
    width: 100%;
    height: 500px;
    max-height: 90%;
    box-shadow: rgb(0 0 0 / 30%) 0px 0px 20px;
    border-top: 1px solid rgb(63, 78, 96);
    transform-origin: center top;
    visibility: visible;
    transition: all 0.2s ease 0s;
    opacity: 1;
    pointer-events: all;
    transform: translateY(0px) scale(1);
  }

  .window-collapsed {
    transform: translateY(0px) scale(1);
    visibility: hidden;
    transition: all 0.2s ease 0s;
    opacity: 0;
    pointer-events: none;
    transform: translateY(15px) scale(1.02);
  }

  .list-scroll {
    height: 100%;
    overflow-y: auto;
    flex-grow: 1;
  }

  main {
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
  }
</style>
