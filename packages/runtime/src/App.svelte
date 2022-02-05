<script>
  import List from './components/List.svelte'
  import Badge from './components/Badge.svelte'
  export let overlayConfig = {}
  export let initialIsOpen = true
  export let checkerResults

  let collapsed = !initialIsOpen
  const toggle = () => {
    collapsed = !collapsed
  }
</script>

<Badge {checkerResults} {collapsed} position={overlayConfig.position} onClick={toggle} />
<main class={`window ${collapsed ? 'window-collapsed' : ''}`} on:click|stopPropagation>
  <div class="list-scroll">
    <List {checkerResults} ulStyle="margin-bottom: 36px;" />
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
    background-color: rgb(11, 21, 33);
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
    /* font-family: var(--monospace);
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
    max-height: 80vh; */
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
    overflow: scroll;
    flex-grow: 1;
  }

  main {
    /* text-align: center; */
    padding: 16px;
    max-width: 240px;
    width: 100%;
    box-sizing: border-box;
    /* margin: 0 auto; */
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
