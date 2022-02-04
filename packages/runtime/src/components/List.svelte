<script>
  import Checker from './Checker.svelte'
  export let checkerResults
  export let ulStyle
</script>

<ul style={ulStyle}>
  {#each checkerResults as checkerResult, index}
    <li>
      {(console.log(checkerResult), '')}
      <Checker diagnostics={checkerResult.diagnostics} {index} />
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
