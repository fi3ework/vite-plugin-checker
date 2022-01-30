<script>
  import Diagnostic from './Diagnostic.svelte'
  export let diagnostics
</script>

<ul>
  {#each diagnostics as diagnostic}
    <Diagnostic {diagnostic} />
  {/each}
</ul>

<style>
  ul {
    list-style: none;
  }
  ul {
    padding-inline: 0;
    margin-block: 0;
  }
</style>
