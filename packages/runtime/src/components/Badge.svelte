<script>
  export let collapsed
  export let checkerResults
  export let onClick

  function calcSummary(results) {
    let errorCount = 0
    let warningCount = 0
    results.forEach((result) => {
      result.diagnostics.forEach((d) => {
        if (d.level === 1) errorCount++
        if (d.level === 0) warningCount++
      })
    })
    return { errorCount, warningCount }
  }

  $: summary = calcSummary(checkerResults)

  $: calcBgColorClass = () => {
    if (!summary) return ''
    if (summary.errorCount > 0) return 'summary-error'
    if (summary.warningCount > 0) return 'summary-warning'
    return 'summary-success'
  }

  $: bgColorClass = calcBgColorClass()
</script>

<button
  class={`badge-button ${collapsed ? `to-uncollpase ${bgColorClass}` : 'to-collpase'}`}
  on:click|stopPropagation={onClick}
>
  {#if collapsed}
    {#if summary.errorCount + summary.warningCount > 0}
      <span class="summary"><span class="emoji">❗️</span>{summary.errorCount}</span>
      <span class="summary"><span class="emoji">⚠️</span>{summary.warningCount}</span>
    {/if}
  {:else}
    <span>Close</span>
  {/if}
</button>

<style>
  .badge-button {
    appearance: none;
    font-size: 0.9em;
    font-weight: bold;
    border: 0px;
    border-radius: 0.3em;
    padding: 0.5em;
    cursor: pointer;
    position: fixed;
    z-index: 99999;
    margin: 0.5em;
    bottom: 0px;
    left: 0px;
  }

  .to-collpase {
    color: white;
    background: rgb(63, 78, 96);
  }

  .to-uncollpase {
    color: white;
  }

  .emoji {
    margin-right: 0.5ch;
    font-family: 'apple color emoji,segoe ui emoji,noto color emoji,android emoji,emojisymbols,emojione mozilla,twemoji mozilla,segoe ui symbol';
  }

  .summary {
    font-family: var(--monospace);
    margin-right: 1ch;
  }

  .summary:last-of-type {
    margin-right: 0;
  }

  .summary-error {
    background: var(--red);
  }

  .summary-warning {
    background: var(--yellow);
  }
</style>
