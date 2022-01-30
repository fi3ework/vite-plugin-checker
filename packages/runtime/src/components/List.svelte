<script>
  import Checker from './Checker.svelte'
  export let checkerResults
</script>

<ul>
  {#each checkerResults as checkerResult}
    <li>
      {(console.log(checkerResult), '')}
      <Checker diagnostics={checkerResult.errors} />
    </li>
  {/each}
</ul>

<style>
  ul,
  li {
    list-style: none;
  }
  ul {
    padding-inline: 0;
    margin-block: 0;
  }
</style>
