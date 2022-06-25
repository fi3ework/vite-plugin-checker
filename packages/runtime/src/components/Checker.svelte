<script>
  import Diagnostic from './Diagnostic.svelte'
  export let diagnostics
  export let base
</script>

<ul>
  {#each diagnostics as diagnostic}
    <Diagnostic {diagnostic} {base} />
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
