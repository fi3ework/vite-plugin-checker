<script>
  export let diagnostic

  const checkerColorMap = {
    TypeScript: '#3178c6',
    ESLint: '#7b7fe3',
    VLS: '#64b587',
    'vue-tsc': '#64b587',
  }

  const fileRE = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g
  const codeframeRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm
  codeframeRE.lastIndex = 0
  $: hasFrame = diagnostic.frame && codeframeRE.test(diagnostic.frame)
  $: message = hasFrame ? diagnostic.message.replace(codeframeRE, '') : diagnostic.message
  // TODO: stackLinks not used
  $: stackLinks = calcLink(diagnostic.stack)
  $: [file] = (diagnostic.loc?.file || diagnostic.id || 'unknown file').split(`?`)

  $: errorSource = diagnostic.loc
    ? { ...calcLink(`${file}:${diagnostic.loc.line}:${diagnostic.loc.column}`)[0], linkFiles: true }
    : { text: file, linkFiles: false }

  function calcLink(text) {
    let curIndex = 0
    let match
    const links = []
    while ((match = fileRE.exec(text))) {
      const { 0: file, index } = match
      if (index !== null) {
        const frag = text.slice(curIndex, index)
        const link = {}
        link.textContent = file
        link.onclick = () => {
          fetch('/__open-in-editor?file=' + encodeURIComponent(file))
        }
        curIndex += frag.length + file.length
        links.push(link)
      }
    }

    return links
  }
</script>

<li class="message-item">
  <pre class="message">
    <span class="plugin" style="color: {checkerColorMap[diagnostic.plugin]}"
      >{`[${diagnostic.plugin}] `}</span
    >
    <span class="message-body">{message}</span>
  </pre>
  <pre class="file">
    {#if errorSource.linkFiles}
      <!-- svelte-ignore a11y-missing-attribute -->
      <a
        class="file-link"
        on:click={errorSource.onclick}>{errorSource.textContent}</a
      >
    {:else}
      {errorSource.text}
    {/if}
  </pre>
  {#if hasFrame}
    <pre class="frame">
      <code class="frame-code">
         {diagnostic.frame}
      </code>
    </pre>
  {/if}
  <pre class="stack">{diagnostic.stack}</pre>
</li>

<style>
  li {
    list-style: none;
  }

  .message-item {
    border-bottom: 1px dotted #666;
    padding: 12px 0 0 0;
  }

  .message {
    white-space: initial;
  }

  pre {
    font-family: var(--monospace);
    font-size: 14px;
    margin-top: 0;
    margin-bottom: 0;
    overflow-x: scroll;
    scrollbar-width: none;
  }

  .frame {
    margin: 1em 0;
    padding: 6px 8px;
    background: #16181d;
    margin-top: 8px;
    border-radius: 8px;
  }

  .frame-code {
    color: var(--yellow);
    font-family: var(--monospace);
  }

  pre::-webkit-scrollbar {
    display: none;
  }

  .message-body {
    color: var(--red);
  }

  .file {
    color: var(--cyan);
    margin-bottom: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .stack {
    font-size: 13px;
    color: var(--dim);
  }

  .file-link {
    text-decoration: underline;
    cursor: pointer;
  }
</style>
